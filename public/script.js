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
    const existingCards = versesContainer.querySelectorAll('.bg-white');
    existingCards.forEach(card => card.remove());
    
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