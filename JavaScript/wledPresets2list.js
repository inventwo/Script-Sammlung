// ============================================
// WLED Preset-Nummer als Liste by inventwo
// ============================================

// WLED Preset Namen Konfiguration
const PRESET_CONFIG = {
    1: "Kerzen",
    2: "Party",
    3: "Jever",
    4: "Orange",
    5: "Regenbogen"
};

// Datenpunkte
const SOURCE_STATE = "wled.0.94b97xxx764.ps";  // WLED Preset Datenpunkt
const TARGET_STATE = "0_userdata.0.WLED.barPresetList";  // Ziel für Widget-Liste

// ============================================
// Finger weg -> Script Start
// ============================================

// Ziel-Datenpunkt erstellen falls nicht vorhanden
createState(TARGET_STATE, {
    name: "WLED Bar Preset Liste",
    type: "number",
    role: "value",
    read: true,
    write: true,
    states: PRESET_CONFIG
}, function() {
    log("Datenpunkt " + TARGET_STATE + " wurde erstellt/aktualisiert");
    
    // Initialer Wert setzen mit Verzögerung, damit Source-State bereit ist
    setTimeout(function() {
        if (existsState(SOURCE_STATE)) {
            const currentValue = getState(SOURCE_STATE);
            if (currentValue && currentValue.val !== null && currentValue.val !== undefined) {
                setState(TARGET_STATE, currentValue.val, true);
                log("Initialer Wert gesetzt: " + currentValue.val);
            }
        } else {
            log("WARNUNG: Source-State " + SOURCE_STATE + " existiert nicht!", "warn");
        }
    }, 1000);
});

// Auf Änderungen am Source-State reagieren (WLED -> Widget)
on({id: SOURCE_STATE, change: "any"}, function(obj) {
    const newValue = obj.state.val;
    
    if (newValue !== null && newValue !== undefined) {
        setState(TARGET_STATE, newValue, true);
        
        const presetName = PRESET_CONFIG[newValue] || "Unbekannt";
        log("WLED Preset gewechselt zu: " + newValue + " (" + presetName + ")");
    }
});

// Auf Änderungen am Target-State reagieren (Widget -> WLED)
on({id: TARGET_STATE, change: "any"}, function(obj) {
    const newValue = obj.state.val;
    
    if (newValue !== null && newValue !== undefined && !obj.state.ack) {
        setState(SOURCE_STATE, newValue, false);
        
        const presetName = PRESET_CONFIG[newValue] || "Unbekannt";
        log("Widget Preset-Auswahl: " + newValue + " (" + presetName + ") -> an WLED gesendet");
    }
});

// log("WLED Preset Script gestartet - " + Object.keys(PRESET_CONFIG).length + " Presets konfiguriert");
