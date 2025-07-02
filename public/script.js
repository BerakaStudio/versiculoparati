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
const downloadSection = document.getElementById('download-section');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Cache for the latest API response to use in PDF generation
let consolationCache = null;

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
    downloadSection.classList.remove('hidden'); // Show download button
}

function showError(message) {
    hideLoading();
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    inputSection.classList.remove('hidden');
}

function resetUI() {
    resultsSection.classList.add('hidden');
    downloadSection.classList.add('hidden'); // Hide download button on reset
    errorMessage.classList.add('hidden');
    inputSection.classList.remove('hidden');
    feelingsInput.value = '';
    versesContainer.innerHTML = '';
    consolationCache = null; // Clear the cache
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
    
    // Detectar URLs y enlaces
    const urlPatterns = [
        /https?:\/\/[^\s]+/gi,
        /www\.[^\s]+\.[a-z]{2,}/gi,
        /[a-zA-Z0-9-]+\.[a-z]{2,}\/[^\s]*/gi
    ];
    for (let pattern of urlPatterns) {
        if (pattern.test(trimmedText)) {
            return { valid: false, message: "Por favor, no incluyas enlaces o URLs. Describe solo tus sentimientos." };
        }
    }
    
    // Detectar patrones de código
    const codePatterns = [
        /[{}\[\]<>]/g,
        /function\s*\(|class\s+[a-zA-Z]/gi
    ];
    for (let pattern of codePatterns) {
        if (pattern.test(trimmedText)) {
            return { valid: false, message: "Por favor, no incluyas código de programación. Comparte solo tus sentimientos." };
        }
    }
    
    return { valid: true };
}

async function getConsolationFromBackend(userInput) {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

// --- PDF Generation ---

function generatePDF() {
    if (!consolationCache) {
        showError("No hay datos para generar el PDF. Por favor, realiza una consulta primero.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- Get and format the date ---
    const today = new Date();
    const dayName = today.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = today.getDate();
    const month = today.toLocaleDateString('es-ES', { month: 'long' });
    const year = today.getFullYear();
    const formattedDate = `El ${dayName} ${day} de ${month} de ${year}`;
    
    // --- Format date for filename ---
    const fileDay = String(today.getDate()).padStart(2, '0');
    const fileMonth = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const fileYear = today.getFullYear();
    const filenameDate = `${fileDay}-${fileMonth}-${fileYear}`;


    // --- PDF Content (Compacted for single page) ---
    const margin = 12; // Reduced margin
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    let currentY = 0;

    // 1. Main Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18); // Reduced font size
    doc.setTextColor(45, 90, 45); // Dark green
    doc.text("Versículo para Tí", pageWidth / 2, currentY + 15, { align: 'center' });
    currentY += 22; // Reduced space after

    // 2. Introductory text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); // Reduced font size
    doc.setTextColor(100, 100, 100);
    const introText = `${formattedDate} indicaste que sentías '${consolationCache.briefSummary}' y Dios te recuerda lo siguiente:`;
    const splitIntro = doc.splitTextToSize(introText, usableWidth);
    doc.text(splitIntro, margin, currentY);
    currentY += (splitIntro.length * 4) + 8; // Reduced space after

    // 3. Initial Reflection with rounded corners
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10); // Reduced font size
    doc.setTextColor(113, 63, 18); // Dark yellow/brown
    const splitReflection = doc.splitTextToSize(consolationCache.initialReflection, usableWidth - 8);
    
    const reflectionHeight = (splitReflection.length * 4.5) + 8; // Reduced height
    doc.setFillColor(254, 243, 199); // Light yellow background
    doc.roundedRect(margin, currentY, usableWidth, reflectionHeight, 3, 3, 'F');
    
    doc.text(splitReflection, margin + 4, currentY + 5); // Reduced padding
    currentY += reflectionHeight + 10; // Reduced space after

    // 4. Verses with rounded borders
    consolationCache.verses.forEach(verse => {
        const textPadding = 4; // Reduced padding
        const usableVerseWidth = usableWidth - (textPadding * 2);
        
        // Pre-calculate text heights with smaller fonts
        const splitRef = doc.setFont("helvetica", "bold").setFontSize(11).splitTextToSize(verse.reference, usableVerseWidth);
        const splitText = doc.setFont("helvetica", "normal").setFontSize(9).splitTextToSize(verse.text, usableVerseWidth);
        const splitVerseReflection = doc.setFont("helvetica", "italic").setFontSize(8).splitTextToSize(`"${verse.reflection}"`, usableVerseWidth);
        
        // Calculate total height for the verse block
        const verseBlockHeight = (splitRef.length * 4) + (splitText.length * 4) + (splitVerseReflection.length * 3.5) + 12;

        const startY = currentY;

        // Draw the rounded green border
        doc.setDrawColor(209, 231, 221); // Light green border
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, startY, usableWidth, verseBlockHeight, 3, 3, 'S');

        currentY += 6; // Reduced top padding

        // Reference
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(45, 90, 45); // Dark green
        doc.text(splitRef, margin + textPadding, currentY);
        currentY += (splitRef.length * 4) + 3;

        // Text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81); // Gray
        doc.text(splitText, margin + textPadding, currentY);
        currentY += (splitText.length * 4) + 3;

        // Reflection
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9); // Orange/yellow
        doc.text(splitVerseReflection, margin + textPadding, currentY);
        
        currentY = startY + verseBlockHeight + 5; // Reduced space between verse blocks
    });

    // --- Save the PDF ---
    doc.save(`Versiculo-para-Ti-${filenameDate}.pdf`);
}


// --- Main Event Handlers ---

getVerseBtn.addEventListener('click', async () => {
    const userInput = feelingsInput.value.trim();
    if (userInput === '') {
        showError("Por favor, escribe algo sobre cómo te sientes antes de continuar.");
        return;
    }

    const validation = isValidTextInput(userInput);
    if (!validation.valid) {
        showError(validation.message);
        return;
    }

    showLoading();

    try {
        const consolationData = await getConsolationFromBackend(userInput);
        consolationCache = consolationData; // Cache the data for PDF generation
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

downloadPdfBtn.addEventListener('click', generatePDF);