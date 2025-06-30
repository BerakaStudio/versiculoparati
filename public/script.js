// DOM Elements
const getVerseBtn = document.getElementById('get-verse-btn');
const feelingsInput = document.getElementById('feelings-input');
const inputSection = document.getElementById('input-section');
const loadingSection = document.getElementById('loading-section');
const loadingText = document.getElementById('loading-text');
const resultsSection = document.getElementById('results-section');
const searchAgainBtn = document.getElementById('search-again-btn');
const initialReflectionContainer = document.getElementById('initial-reflection-container');
const initialReflection = document.getElementById('initial-reflection');
const versesContainer = document.getElementById('verses-container');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

const loadingPhrases = [
    "Buscando los versículos apropiados para ti...",
    "Ten fe, Dios obra de formas inesperadas...",
    "Preparando un mensaje de esperanza para tu corazón...",
    "Consultando la sabiduría divina...",
    "Pidiendo guía para encontrar las palabras justas..."
];
let phraseInterval;

// --- Helper Functions ---

function showLoading() {
    inputSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    loadingSection.classList.add('flex');
    
    let i = 0;
    loadingText.textContent = loadingPhrases[i];
    phraseInterval = setInterval(() => {
        i = (i + 1) % loadingPhrases.length;
        loadingText.textContent = loadingPhrases[i];
    }, 2500);
}

function hideLoading() {
    loadingSection.classList.add('hidden');
    loadingSection.classList.remove('flex');
    clearInterval(phraseInterval);
}

function showResults() {
    resultsSection.classList.remove('hidden');
}

function showError(message) {
    hideLoading();
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    inputSection.classList.remove('hidden');
}

function resetUI() {
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    inputSection.classList.remove('hidden');
    feelingsInput.value = '';
    versesContainer.innerHTML = '';
}

function isValidTextInput(text) {
    // Eliminar espacios en blanco
    const trimmedText = text.trim();
    
    // Verificar longitud mínima
    if (trimmedText.length < 3) {
        return { valid: false, message: "Por favor, escribe al menos algunas palabras sobre cómo te sientes." };
    }
    
    // Verificar que contenga principalmente letras (al menos 70% del texto)
    const letterCount = (trimmedText.match(/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g) || []).length;
    const letterPercentage = letterCount / trimmedText.length;
    
    if (letterPercentage < 0.7) {
        return { valid: false, message: "Por favor, escribe solo texto describiendo tus sentimientos y emociones." };
    }
    
    // Verificar que no sea solo números o símbolos matemáticos
    const mathPattern = /^[\d\+\-\*\/\=\(\)\.\s]+$/;
    if (mathPattern.test(trimmedText)) {
        return { valid: false, message: "Por favor, describe tus sentimientos con palabras, no con números o operaciones." };
    }
    
    // Verificar que no sea solo emojis o símbolos
    const emojiPattern = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*$/u;
    if (emojiPattern.test(trimmedText)) {
        return { valid: false, message: "Por favor, usa palabras para describir cómo te sientes en lugar de solo emojis." };
    }
    
    // --- NUEVAS VALIDACIONES ---
    
    // Detectar URLs y enlaces (patrones más amplios)
    const urlPatterns = [
        /https?:\/\/[^\s]+/gi,                    // http:// o https://
        /www\.[^\s]+\.[a-z]{2,}/gi,              // www.ejemplo.com
        /[a-zA-Z0-9-]+\.[a-z]{2,}\/[^\s]*/gi,    // dominio.com/algo
        /[a-zA-Z0-9-]+\.(com|org|net|edu|gov|mil|int|co|es|mx|ar|cl|pe|ve|bo|py|uy|ec|br)[^\s]*/gi, // dominios comunes
        /[^\s]+@[^\s]+\.[a-z]{2,}/gi             // emails básicos
    ];
    
    for (let pattern of urlPatterns) {
        if (pattern.test(trimmedText)) {
            return { valid: false, message: "Por favor, no incluyas enlaces, URLs o direcciones web. Describe solo tus sentimientos con palabras." };
        }
    }
    
    // Detectar patrones de código común
    const codePatterns = [
        /[{}\[\]]/g,                              // Llaves y corchetes de código
        /[<>]/g,                                  // Etiquetas HTML/XML
        /<[^>]+>/g,                              // Etiquetas HTML completas
        /function\s*\(/gi,                        // Declaraciones de función
        /var\s+|let\s+|const\s+/gi,              // Declaraciones de variables JS
        /class\s+[a-zA-Z]/gi,                     // Declaraciones de clase
        /import\s+|export\s+/gi,                  // Imports/exports
        /if\s*\(|while\s*\(|for\s*\(/gi,         // Estructuras de control
        /console\.[a-zA-Z]+\(/gi,                 // Console methods
        /document\.[a-zA-Z]+/gi,                  // DOM manipulation
        /\$\([^)]*\)/g,                          // jQuery selectors
        /[a-zA-Z]+\(\s*\)/g,                     // Llamadas a función vacías
        /[a-zA-Z_][a-zA-Z0-9_]*\s*[=:]\s*[^,;]+[;,]/g, // Asignaciones de variables
        /\/\*.*?\*\//gs,                         // Comentarios /* */
        /\/\/.*$/gm,                             // Comentarios //
        /^\s*[#]+\s/gm,                          // Headers de markdown
        /`[^`]*`/g,                              // Backticks (código inline)
        /```[\s\S]*?```/g,                       // Bloques de código markdown
        /SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+/gi, // SQL básico
        /\bdef\s+|\bclass\s+|\bimport\s+/gi,     // Python keywords
        /\#include|void\s+main/gi,                // C/C++ patterns
        /public\s+static\s+void/gi                // Java patterns
    ];
    
    for (let pattern of codePatterns) {
        if (pattern.test(trimmedText)) {
            return { valid: false, message: "Por favor, no incluyas código de programación. Comparte solo tus sentimientos y emociones con palabras naturales." };
        }
    }
    
    // Detectar patrones sospechosos adicionales
    const suspiciousPatterns = [
        /[a-zA-Z0-9]{20,}/g,                     // Cadenas muy largas sin espacios (posibles tokens, hashes, etc.)
        /[^\w\s\.,;:!?¡¿'"()\-áéíóúüñÁÉÍÓÚÜÑ]/g, // Caracteres especiales no típicos del texto natural
        /\b[A-Z]{3,}\b/g,                        // Palabras en mayúsculas (posibles códigos)
        /\d{4,}/g                                // Números de 4+ dígitos (posibles códigos, IDs, etc.)
    ];
    
    // Contar ocurrencias sospechosas
    let suspiciousCount = 0;
    for (let pattern of suspiciousPatterns) {
        const matches = trimmedText.match(pattern);
        if (matches) {
            suspiciousCount += matches.length;
        }
    }
    
    // Si hay muchos patrones sospechosos, rechazar
    if (suspiciousCount > 3) {
        return { valid: false, message: "El texto parece contener código o información técnica. Por favor, describe solo tus sentimientos con palabras naturales." };
    }
    
    // Verificar que el texto tenga suficientes palabras comunes del español
    const commonSpanishWords = /\b(yo|tu|tú|el|la|los|las|un|una|de|del|en|con|por|para|que|es|son|se|me|te|le|nos|os|les|muy|más|pero|como|cuando|donde|dónde|porque|porqué|si|sí|no|también|solo|sólo|algo|nada|todo|todos|todas|bien|mal|mejor|peor|grande|pequeño|nuevo|viejo|bueno|malo|feliz|triste|amor|vida|tiempo|casa|familia|amigo|amigos|trabajo|dinero|problema|problemas|siento|sientes|sienten|estoy|estás|está|estamos|están|tengo|tienes|tiene|tenemos|tienen|quiero|quieres|quiere|queremos|quieren|necesito|necesitas|necesita|necesitamos|necesitan|dios|señor|jesús|cristo|fe|esperanza|paz|oración|bendición)\b/gi;
    
    const spanishMatches = trimmedText.match(commonSpanishWords);
    const spanishWordCount = spanishMatches ? spanishMatches.length : 0;
    const totalWords = trimmedText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Al menos 30% de las palabras deberían ser palabras comunes del español
    if (totalWords > 5 && spanishWordCount / totalWords < 0.3) {
        return { valid: false, message: "Por favor, escribe tu mensaje en español natural, describiendo tus sentimientos y emociones." };
    }
    
    return { valid: true };
}

// Nueva función que llama a nuestro backend en lugar de directamente a Gemini
async function getConsolationFromBackend(userInput) {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userInput })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error del servidor: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.initialReflection || !result.verses || !Array.isArray(result.verses) || result.verses.length === 0) {
            throw new Error("La respuesta del servidor no tiene el formato esperado.");
        }
        
        return result;
    } catch (error) {
        console.error("Error al obtener la consolación del backend:", error);
        throw new Error(error.message || "No se pudo procesar tu solicitud. Por favor, inténtalo de nuevo.");
    }
}

function renderResults(consolationData) {
    initialReflection.textContent = consolationData.initialReflection;
    
    // Limpiar solo las tarjetas de versículos previas, manteniendo el título
    const existingCards = versesContainer.querySelectorAll('.bg-white');
    existingCards.forEach(card => card.remove());
    
    // Si no existe el título, crearlo
    if (!versesContainer.querySelector('.verses-title')) {
        const title = document.createElement('h2');
        title.className = 'verses-title';
        title.textContent = 'Versículos que Dios tiene para tí';
        versesContainer.appendChild(title);
    }
    
    consolationData.verses.forEach(verse => {
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-2xl shadow-md border border-gray-200 flex items-start space-x-4 animate-fade-in';
        
        card.innerHTML = `
            <div class="flex-shrink-0 text-green-700 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open-text"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="M6 8h2"/><path d="M6 12h2"/><path d="M16 8h2"/><path d="M16 12h2"/></svg>
            </div>
            <div>
                <h3 class="font-bold text-lg text-green-900">${verse.reference}</h3>
                <p class="mt-1 text-gray-700 text-base leading-relaxed">${verse.text}</p>
                <p class="mt-3 text-sm text-yellow-800 italic verse-reflec">"${verse.reflection}"</p>
            </div>
        `;
        versesContainer.appendChild(card);
    });
    
    hideLoading();
    showResults();
}

// --- Main Event Handler ---

getVerseBtn.addEventListener('click', async () => {
    const userInput = feelingsInput.value.trim();
    if (userInput === '') {
        showError("Por favor, escribe algo sobre cómo te sientes antes de continuar.");
        return;
    }

    // Agregar validación de contenido
    const validation = isValidTextInput(userInput);
    if (!validation.valid) {
        showError(validation.message);
        return;
    }

    showLoading();

    try {
        const consolationData = await getConsolationFromBackend(userInput);
        console.log("Datos de consolación generados:", consolationData);

        if (!consolationData || !consolationData.verses || consolationData.verses.length === 0) {
            throw new Error("No se pudo obtener una respuesta válida. Por favor, intenta con otra consulta.");
        }
        
        renderResults(consolationData);

    } catch (error) {
        console.error("Ha ocurrido un error en el proceso:", error);
        showError(error.message || "Algo salió mal. Por favor, revisa tu conexión o inténtalo de nuevo más tarde.");
    }
});

searchAgainBtn.addEventListener('click', resetUI);