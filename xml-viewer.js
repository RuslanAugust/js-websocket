document.addEventListener('DOMContentLoaded', () => {
    const loadXmlBtn = document.getElementById('loadXmlBtn');
    const loadJsonBtn = document.getElementById('loadJsonBtn');
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

    const createXmlTree = (node, depth = 0) => {
        let html = '';
        const indent = '  '.repeat(depth);
        
        if (node.nodeType === 1) {
            const nodeName = node.nodeName;
            const children = Array.from(node.childNodes);
            const hasElements = children.some(child => child.nodeType === 1);
            const hasText = children.some(child => child.nodeType === 3 && child.textContent.trim());
            
            if (!hasElements && !hasText) {
                html += `${indent}<span class="xml-tag">&lt;${nodeName}/&gt;</span>`;
            } else if (!hasElements && hasText) {
                const text = node.textContent.trim();
                html += `${indent}<span class="xml-tag">&lt;${nodeName}&gt;</span>`;
                html += `<span class="xml-text">${escapeHtml(text)}</span>`;
                html += `<span class="xml-tag">&lt;/${nodeName}&gt;</span>`;
            } else {
                const id = `xml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                html += `${indent}<span class="xml-toggle" data-target="${id}">&lt;${nodeName}&gt;...</span>`;
                html += `<div class="xml-collapse" id="${id}">`;
                
                children.forEach(child => {
                    html += `<div class="xml-line">`;
                    html += createXmlTree(child, depth + 1);
                    html += `</div>`;
                });
                
                html += `${indent}<span class="xml-tag">&lt;/${nodeName}&gt;</span>`;
                html += `</div>`;
            }
        } else if (node.nodeType === 3 && node.textContent.trim()) {
            const text = node.textContent.trim();
            html += `<span class="xml-text">${escapeHtml(text)}</span>`;
        }
        
        return html;
    };

    const displayXmlData = (xmlString, fileName = '') => {
        let html = '<div class="data-section">';
        
        if (fileName) {
            html += `<div class="file-info">
                <h3>Файл: ${escapeHtml(fileName)}</h3>
            </div>`;
        }
        
        html += '<h2>Данные из XML файла</h2>';
        html += '<div class="xml-tree">';
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            html += `<div class="error-message">Ошибка парсинга XML</div>`;
            html += `<pre>${escapeHtml(xmlString)}</pre>`;
        } else {
            html += createXmlTree(xmlDoc.documentElement);
        }
        
        html += '</div>';
        html += '<h3>Исходный XML</h3>';
        html += `<pre class="xml-source">${escapeHtml(xmlString)}</pre>`;
        html += '</div>';
        
        return html;
    };

    const setupXmlToggleListeners = () => {
        document.querySelectorAll('.xml-toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const target = document.getElementById(targetId);
                
                if (target.style.display === 'none' || !target.style.display) {
                    target.style.display = 'block';
                    this.innerHTML = this.innerHTML.replace('...', '–');
                } else {
                    target.style.display = 'none';
                    this.innerHTML = this.innerHTML.replace('–', '...');
                }
            });
        });
    };

    const loadXmlFileWithFileReader = () => {
        return new Promise((resolve, reject) => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.xml';
            fileInput.style.display = 'none';
            
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) {
                    reject(new Error('Файл не выбран'));
                    return;
                }
                
                if (!file.name.toLowerCase().endsWith('.xml')) {
                    reject(new Error('Пожалуйста, выберите XML файл'));
                    return;
                }
                
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    resolve({
                        data: e.target.result,
                        fileName: file.name,
                        fileSize: (file.size / 1024).toFixed(2) + ' KB'
                    });
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

    loadXmlBtn.addEventListener('click', async () => {
        showLoader();
        
        try {
            const result = await loadXmlFileWithFileReader();
            hideLoader();
            
            dataDisplay.innerHTML = displayXmlData(result.data, result.fileName);
            dataDisplay.classList.add('loaded');
            
            setTimeout(setupXmlToggleListeners, 0);
            
            const infoDiv = document.createElement('div');
            infoDiv.innerHTML = `
                <div style="background:#d4edda; color:#155724; padding:12px 20px; border-radius:6px; margin-bottom:20px;">
                    <strong>XML файл успешно загружен!</strong><br>
                    <small>Имя: ${result.fileName} | Размер: ${result.fileSize}</small>
                </div>
            `;
            dataDisplay.prepend(infoDiv);
            
        } catch (error) {
            hideLoader();
            dataDisplay.innerHTML = `
                <div class="error-message">
                    <h3>Ошибка загрузки XML</h3>
                    <p>${error.message}</p>
                    <p>Убедитесь, что вы выбираете файл data.xml</p>
                </div>
            `;
        }
    });

    loadJsonBtn.addEventListener('click', () => {
        dataDisplay.innerHTML = `
            <div class="info-message">
                <h3>Загрузка JSON</h3>
                <p>Для загрузки JSON используйте кнопку в json-viewer.js</p>
            </div>
        `;
    });

    clearBtn.addEventListener('click', () => {
        dataDisplay.innerHTML = '<p class="placeholder">Данные будут отображены здесь после нажатия на кнопку "Загрузить XML"</p>';
        dataDisplay.classList.remove('loaded');
    });
});
