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
                return `<span class="json-string">"${escapeHtml(value)}"</span>`;
            case 'number':
                return `<span class="json-number">${value}</span>`;
            case 'boolean':
                return `<span class="json-boolean">${value}</span>`;
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
    
    const displayJsonData = (data, fileName = '') => {
        let html = '<div class="data-section">';
        
        if (fileName) {
            html += `<div class="file-info">
                <h3>Файл: ${escapeHtml(fileName)}</h3>
            </div>`;
        }
        
        html += '<h2>Данные из JSON файла</h2>';
        html += '<div class="json-tree">';
        html += createJsonTree(data);
        html += '</div>';
        html += '<h3>Исходный JSON</h3>';
        html += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        html += '</div>';
        
        return html;
    };
    
    const setupJsonToggleListeners = () => {
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
    
    const loadJsonFile = () => {
        return new Promise((resolve, reject) => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) {
                    reject(new Error('Файл не выбран'));
                    return;
                }
                
                if (!file.name.toLowerCase().endsWith('.json')) {
                    reject(new Error('Пожалуйста, выберите JSON файл'));
                    return;
                }
                
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        resolve({
                            data: data,
                            fileName: file.name,
                            fileSize: (file.size / 1024).toFixed(2) + ' KB'
                        });
                    } catch (error) {
                        reject(new Error('Ошибка парсинга JSON'));
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Ошибка чтения файла'));
                };
                
                reader.readAsText(file);
            };
            
            document.body.appendChild(fileInput);
            fileInput.click();
            setTimeout(() => {
                if (fileInput.parentNode) {
                    fileInput.parentNode.removeChild(fileInput);
                }
            }, 100);
        });
    };
    
    loadJsonBtn.addEventListener('click', async () => {
        showLoader();
        
        try {
            const result = await loadJsonFile();
            hideLoader();
            
            dataDisplay.innerHTML = displayJsonData(result.data, result.fileName);
            dataDisplay.classList.add('loaded');
            
            setTimeout(setupJsonToggleListeners, 0);
            
            const infoDiv = document.createElement('div');
            infoDiv.innerHTML = `
                <div style="background:#d4edda; color:#155724; padding:12px 20px; border-radius:6px; margin-bottom:20px;">
                    <strong>JSON файл успешно загружен!</strong><br>
                    <small>Имя: ${result.fileName} | Размер: ${result.fileSize}</small>
                </div>
            `;
            dataDisplay.prepend(infoDiv);
            
        } catch (error) {
            hideLoader();
            dataDisplay.innerHTML = `
                <div class="error-message">
                    <h3>Ошибка загрузки JSON</h3>
                    <p>${error.message}</p>
                    <p>Убедитесь, что вы выбираете файл data.json</p>
                </div>
            `;
        }
    });
    
    loadXmlBtn.addEventListener('click', () => {
        dataDisplay.innerHTML = `
            <div class="info-message">
                <h3>Загрузка XML</h3>
                <p>Для загрузки XML используйте кнопку в xml-viewer.js</p>
            </div>
        `;
    });
    
    clearBtn.addEventListener('click', () => {
        dataDisplay.innerHTML = '<p class="placeholder">Данные будут отображены здесь после нажатия на кнопку "Загрузить JSON" или "Загрузить XML"</p>';
        dataDisplay.classList.remove('loaded');
    });
});
