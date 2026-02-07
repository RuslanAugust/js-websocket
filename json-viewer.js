document.addEventListener('DOMContentLoaded', () => {
    const loadJsonBtn = document.getElementById('loadJsonBtn');
    const loadXmlBtn = document.getElementById('loadXmlBtn');
    const clearBtn = document.getElementById('clearBtn');
    const dataDisplay = document.getElementById('dataDisplay');
    const loader = document.getElementById('loader');
    
    const showLoader = () => {
        loader.style.display = 'block';
        dataDisplay.innerHTML = '';
    };
    
    const hideLoader = () => {
        loader.style.display = 'none';
    };
    
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    const getType = (value) => {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    };
    
    const formatValue = (value) => {
        const type = getType(value);
        
        switch(type) {
            case 'string':
                return `"${escapeHtml(value)}"`;
            case 'number':
            case 'boolean':
                return `<span class="json-value json-${type}">${value}</span>`;
            case 'null':
                return `<span class="json-null">null</span>`;
            default:
                return '';
        }
    };
    
    const createJsonTree = (data, key = '', depth = 0) => {
        const type = getType(data);
        let html = '';
        const indent = '  '.repeat(depth);
        
        if (key) {
            html += `${indent}<span class="json-key">"${escapeHtml(key)}"</span>: `;
        }
        
        if (type === 'object' && data !== null) {
            const entries = Object.entries(data);
            if (entries.length === 0) {
                html += `{}`;
            } else {
                const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                html += `<span class="json-toggle" data-target="${id}">{...}</span>`;
                html += `<div class="json-collapse" id="${id}">`;
                
                entries.forEach(([entryKey, value], index) => {
                    html += `<div class="json-line">`;
                    html += createJsonTree(value, entryKey, depth + 1);
                    if (index < entries.length - 1) {
                        html += ',';
                    }
                    html += `</div>`;
                });
                
                html += `${indent}}`;
                html += `</div>`;
            }
        }
        else if (type === 'array') {
            if (data.length === 0) {
                html += `[]`;
            } else {
                const id = `arr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                html += `<span class="json-toggle" data-target="${id}">[...]</span>`;
                html += `<div class="json-collapse" id="${id}">`;
                
                data.forEach((item, index) => {
                    html += `<div class="json-line">`;
                    html += createJsonTree(item, '', depth + 1);
                    if (index < data.length - 1) {
                        html += ',';
                    }
                    html += `</div>`;
                });
                
                html += `${indent}]`;
                html += `</div>`;
            }
        }
        else {
            html += formatValue(data);
        }
        
        return html;
    };
    
    const displayJsonTree = (data, fileName = '') => {
        let html = '<div class="json-viewer">';
        
        if (fileName) {
            html += `<div class="file-info">
                <h3>Файл: ${escapeHtml(fileName)}</h3>
            </div>`;
        }
        
        html += '<div class="json-tree">';
        html += createJsonTree(data);
        html += '</div>';
        
        html += `<div class="json-stats">
            <p><strong>Структура JSON:</strong></p>
            <ul>
                <li>Всего ключей: ${countKeys(data)}</li>
                <li>Всего элементов: ${countElements(data)}</li>
                <li>Максимальная глубина: ${getDepth(data)}</li>
            </ul>
        </div>`;
        
        html += '</div>';
        return html;
    };
    
    const countKeys = (obj) => {
        if (typeof obj !== 'object' || obj === null) return 0;
        
        let count = Object.keys(obj).length;
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                count += countKeys(obj[key]);
            }
        }
        return count;
    };
    
    const countElements = (obj) => {
        if (Array.isArray(obj)) {
            return obj.reduce((sum, item) => sum + countElements(item), obj.length);
        } else if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).reduce((sum, item) => sum + countElements(item), 0);
        }
        return 1;
    };
    
    const getDepth = (obj, currentDepth = 0) => {
        if (typeof obj !== 'object' || obj === null) return currentDepth;
        
        let maxDepth = currentDepth;
        if (Array.isArray(obj)) {
            for (const item of obj) {
                maxDepth = Math.max(maxDepth, getDepth(item, currentDepth + 1));
            }
        } else {
            for (const key in obj) {
                maxDepth = Math.max(maxDepth, getDepth(obj[key], currentDepth + 1));
            }
        }
        return maxDepth;
    };
    
    const setupToggleListeners = () => {
        document.querySelectorAll('.json-toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const target = document.getElementById(targetId);
                
                if (target.style.display === 'none' || !target.style.display) {
                    target.style.display = 'block';
                    this.textContent = this.textContent.replace('...', '–');
                } else {
                    target.style.display = 'none';
                    this.textContent = this.textContent.replace('–', '...');
                }
            });
        });
    };
    
    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    };
    
    loadJsonBtn.addEventListener('click', async () => {
        showLoader();
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) {
                hideLoader();
                return;
            }
            
            if (!file.name.toLowerCase().endsWith('.json')) {
                hideLoader();
                dataDisplay.innerHTML = `
                    <div class="error-message">
                        <h3>Ошибка</h3>
                        <p>Пожалуйста, выберите файл с расширением .json</p>
                    </div>
                `;
                return;
            }
            
            try {
                const text = await readFileAsText(file);
                const data = JSON.parse(text);
                
                hideLoader();
                dataDisplay.innerHTML = displayJsonTree(data, file.name);
                dataDisplay.classList.add('loaded');
                
                setTimeout(setupToggleListeners, 0);
                
            } catch (error) {
                hideLoader();
                dataDisplay.innerHTML = `
                    <div class="error-message">
                        <h3>Ошибка загрузки JSON</h3>
                        <p>${error.message}</p>
                        <p>Убедитесь, что файл содержит корректный JSON-формат.</p>
                    </div>
                `;
            }
        };
        
        document.body.appendChild(fileInput);
        fileInput.click();
        setTimeout(() => {
            if (fileInput.parentNode) {
                fileInput.parentNode.removeChild(fileInput);
            }
        }, 100);
    });
    
    loadXmlBtn.addEventListener('click', () => {
        dataDisplay.innerHTML = `
            <div class="info-message">
                <h3>Загрузка XML</h3>
                <p>Для загрузки XML используйте файл xml-viewer.js</p>
            </div>
        `;
        dataDisplay.classList.remove('loaded');
    });
    
    clearBtn.addEventListener('click', () => {
        dataDisplay.innerHTML = '<p class="placeholder">Данные будут отображены здесь после нажатия на кнопку "Загрузить JSON"</p>';
        dataDisplay.classList.remove('loaded');
    });
});
