const badWords = [
    'chó', 'ngu', 'điên', 'khùng', 'cứt',
    'đụ', 'đéo', 'đm', 'vãi', 'fuck', 'shit',
    'lồn', 'buồi', 'cặc', 'ỉa'
];

export const filterBadWords = (text) => {
    if (!text) return text;
    let filteredText = text;
    badWords.forEach(word => {
        // Simple regex to replace exact matches or words containing bad words depending on strictness
        // Here we use simple global replacement case-insensitive
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, (match) => '*'.repeat(match.length));
    });
    return filteredText;
};
