// DOM Elements
const getVerseBtn = document.getElementById('get-verse-btn');
const feelingsInput = document.getElementById('feelings-input');
const inputSection = document.getElementById('input-section');
const loadingSection = document.getElementById('loading-section');
const loadingText = document.getElementById('loading-text');
const resultsSection = document.getElementById('results-section');
const searchAgainBtn = document.getElementById('search-again-btn');
const initialReflection = document.getElementById('initial-reflection');
const versesContainer = document.getElementById('verses-container');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
// New DOM Elements
const moreVersesBtn = document.getElementById('more-verses-btn');
const savePdfBtn = document.getElementById('save-pdf-btn');

// --- State Management ---
let originalUserInput = '';
let currentVerseData = null;

// --- API Configuration ---
const GEMINI_API_KEY = ""; // Kept empty to be handled by the execution environment
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;


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
    currentVerseData = null;
    originalUserInput = '';
}

async function callGemini(prompt) {
     const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Error en la API de IA: ${response.status}. ${errorBody}`);
        }
        
        const result = await response.json();
        
        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0].text) {
             const jsonString = result.candidates[0].content.parts[0].text;
             const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
             return JSON.parse(cleanedJsonString);
        } else {
             if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason === 'SAFETY') {
                throw new Error('La respuesta fue bloqueada por motivos de seguridad. Intenta reformular tu consulta.');
             }
             throw new Error('La respuesta de la IA no contiene datos válidos.');
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`No se pudo procesar la solicitud a la IA. ${error.message}`);
    }
}

function getInitialConsolationPrompt(userInput) {
    return `
    Un usuario, que busca consuelo bíblico, escribió: "${userInput}"
    Tu tarea es actuar como un consejero cristiano sabio y empático.
    Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
    {
      "initialReflection": "Un mensaje reflexivo inicial, cálido y tranquilizador, de 2-3 frases.",
      "verses": [
        { "reference": "Mateo 11:28", "text": "...", "reflection": "..." },
        { "reference": "Salmo 23:1", "text": "...", "reflection": "..." },
        { "reference": "...", "text": "...", "reflection": "..." },
        { "reference": "...", "text": "...", "reflection": "..." },
        { "reference": "...", "text": "...", "reflection": "..." }
      ]
    }
    Asegúrate de que el array 'verses' contenga exactamente 5 versículos relevantes (texto de la versión TLA y su reflexión). El tono debe ser siempre de esperanza.`;
}

function getMoreVersesPrompt(userInput, existingVerses) {
    const existingRefs = existingVerses.map(v => v.reference).join(', ');
    return `
    Un usuario escribió: "${userInput}".
    Ya se le mostraron estos versículos: ${existingRefs}.
    Por favor, proporciona 5 versículos MÁS, diferentes a los anteriores, que también ofrezcan consuelo.
    Responde ÚNICAMENTE con un objeto JSON válido con un array "verses" que contenga 5 nuevos objetos de versículo.
    {
      "verses": [
        { "reference": "...", "text": "...", "reflection": "..." }
      ]
    }`;
}


function renderInitialResults(consolationData) {
    initialReflection.textContent = consolationData.initialReflection;
    versesContainer.innerHTML = ''; // Clear previous results
    
    consolationData.verses.forEach(appendVerseCard);
    
    hideLoading();
    showResults();
}

function appendVerseCard(verse) {
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
}

function generatePdf() {
    if (!currentVerseData) {
        alert("No hay versículos para guardar. Por favor, realiza una búsqueda primero.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 2 * margin;
    let y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Versículos Para Tí', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Un mensaje para ti:', margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const reflectionLines = doc.splitTextToSize(currentVerseData.initialReflection, usableWidth);
    doc.text(reflectionLines, margin, y);
    y += reflectionLines.length * 5 + 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Versículos que Dios tiene para tí:', margin, y);
    y += 10;

    currentVerseData.verses.forEach(verse => {
        if (y > 270) { // Add new page if content is about to overflow
            doc.addPage();
            y = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(verse.reference, margin, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const textLines = doc.splitTextToSize(verse.text, usableWidth);
        doc.text(textLines, margin, y);
        y += textLines.length * 5 + 5;
        
        doc.setFont('helvetica', 'italic');
        const reflectionLines = doc.splitTextToSize(`"${verse.reflection}"`, usableWidth);
        doc.text(reflectionLines, margin, y);
        y += reflectionLines.length * 5 + 15;
    });

    doc.save('Versiculos-Para-Ti.pdf');
}


// --- Event Handlers ---

getVerseBtn.addEventListener('click', async () => {
    originalUserInput = feelingsInput.value.trim();
    if (originalUserInput === '') {
        showError("Por favor, escribe algo sobre cómo te sientes antes de continuar.");
        return;
    }

    showLoading();

    try {
        const prompt = getInitialConsolationPrompt(originalUserInput);
        currentVerseData = await callGemini(prompt);
        renderInitialResults(currentVerseData);
    } catch (error) {
        showError(error.message);
    }
});

moreVersesBtn.addEventListener('click', async () => {
    if (!originalUserInput || !currentVerseData) return;
    
    moreVersesBtn.textContent = 'Buscando...';
    moreVersesBtn.classList.add('loading');
    moreVersesBtn.disabled = true;

    try {
        const prompt = getMoreVersesPrompt(originalUserInput, currentVerseData.verses);
        const newVerseData = await callGemini(prompt);
        
        if(newVerseData.verses && newVerseData.verses.length > 0) {
            newVerseData.verses.forEach(verse => {
                currentVerseData.verses.push(verse); // Add to state
                appendVerseCard(verse); // Add to UI
            });
        }
    } catch (error) {
        alert(`No se pudieron cargar más versículos: ${error.message}`);
    } finally {
        moreVersesBtn.textContent = 'Mostrar más versículos';
        moreVersesBtn.classList.remove('loading');
        moreVersesBtn.disabled = false;
    }
});

savePdfBtn.addEventListener('click', generatePdf);

searchAgainBtn.addEventListener('click', resetUI);
