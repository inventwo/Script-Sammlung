// Konfiguration
const sourceBase = 'life360ng.0.people.xxx-xxx-xxx';
const minDistance = 20;

// Hilfsfunktion für den Namen (damit wir sie überall nutzen können)
function getTargetDP() {
    const now = new Date();
    const dateString = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
    return `0_userdata.0.Tracker.xxx.History_${dateString}`;
}

// Initialisierung beim Start des Skripts
async function init() {
    const targetDP = getTargetDP();
    
    // Prüfen, ob der Datenpunkt existiert
    if (!(await existsStateAsync(targetDP))) {
        console.log(`Erstelle neuen Datenpunkt für heute: ${targetDP}`);
        
        // Aktuelle Koordinaten als Startpunkt holen
        const currentLat = await getStateAsync(`${sourceBase}.latitude`);
        const currentLong = await getStateAsync(`${sourceBase}.longitude`);
        
        let initialGeoJSON = getEmptyGeoJSON();
        
        // Falls Koordinaten vorhanden sind, sofort als ersten Punkt eintragen
        if (currentLat && currentLat.val && currentLong && currentLong.val) {
            initialGeoJSON.geometry.coordinates.push([currentLong.val, currentLat.val]);
            initialGeoJSON.properties.timestamps.push(Date.now());
            console.log(`Startpunkt gesetzt: ${currentLat.val}, ${currentLong.val}`);
        }

        await createStateAsync(targetDP, JSON.stringify(initialGeoJSON), {
            name: `Fahrtenbuch`,
            type: 'string',
            role: 'json'
        });
    } else {
        console.log(`Datenpunkt für heute existiert bereits: ${targetDP}`);
    }
}

// Start ausführen
init();

// Trigger auf Latitude
on({id: `${sourceBase}.latitude`, change: 'ne'}, async function (obj) {
    const lat = obj.state.val;
    const longState = await getStateAsync(`${sourceBase}.longitude`);
    const long = longState.val;

    if (lat === null || long === null) return;

    const targetDP = getTargetDP();

    // Sicherheitshalber prüfen (falls Mitternacht gerade vorbei ist)
    if (!(await existsStateAsync(targetDP))) {
        await createStateAsync(targetDP, JSON.stringify(getEmptyGeoJSON()), {
            name: `Fahrtenbuch`,
            type: 'string',
            role: 'json'
        });
        // Kurz warten, damit ioBroker den DP registrieren kann
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const historyState = await getStateAsync(targetDP);
    let geoJson;
    
    try {
        geoJson = (historyState && historyState.val) ? JSON.parse(historyState.val) : getEmptyGeoJSON();
    } catch (e) {
        geoJson = getEmptyGeoJSON();
    }

    if (shouldUpdate(geoJson, lat, long)) {
        geoJson.geometry.coordinates.push([long, lat]);
        geoJson.properties.timestamps.push(Date.now());
        setState(targetDP, JSON.stringify(geoJson), true);
        console.log(`Punkt hinzugefügt zu ${targetDP}`);
    }
});

// -- Hilfsfunktionen bleiben gleich --
function getEmptyGeoJSON() {
    return { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: { timestamps: [] } };
}

function shouldUpdate(geoJson, newLat, newLong) {
    const coords = geoJson.geometry.coordinates;
    if (coords.length === 0) return true;
    const lastPoint = coords[coords.length - 1];
    const dist = getDistance(lastPoint[1], lastPoint[0], newLat, newLong);
    return dist >= minDistance;
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180; const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180; const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}
