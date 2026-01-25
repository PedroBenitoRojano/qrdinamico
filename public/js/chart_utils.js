function fillMissingDates(data) {
    const filledData = [];
    const dataMap = new Map();

    // Normalizar datos existentes
    if (Array.isArray(data)) {
        data.forEach(item => {
            // Asumimos que item.date viene como YYYY-MM-DD
            if (item && item.date) {
                dataMap.set(item.date, item.visits);
            }
        });
    }

    // Generar últimos 7 días
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Formato YYYY-MM-DD local para coincidir mejor con la intención del usuario
        // Ojo: el backend puede estar en UTC. Vamos a intentar ser consistentes.
        // Si usamos toISOString().split('T')[0] obtenemos UTC date.
        const dateStr = d.toISOString().split('T')[0];

        filledData.push({
            date: dateStr,
            visits: dataMap.get(dateStr) || 0
        });
    }
    return filledData;
}
