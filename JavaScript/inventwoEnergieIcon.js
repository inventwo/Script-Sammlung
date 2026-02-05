// Script um die 3D-Icons von inventwo als URL-Datenpunkte abzuspeichern

const apiUrl = 'https://api.github.com/repos/inventwo/ioBroker.vis-icontwo/contents/www/3D_Icons';
// Hier deinen Wunschpfad angeben
const dpBase = '0_userdata.0.energyIcons';
// Ab hier, Finger weg
httpGet(apiUrl, { headers: { 'User-Agent': 'ioBroker' } }, (err, response) => {

    if (err) {
        log('GitHub API Fehler: ' + err, 'error');
        return;
    }

    let files;
    try {
        files = JSON.parse(response.data);
    } catch (e) {
        log('JSON Parse Fehler', 'error');
        return;
    }

    if (!Array.isArray(files)) {
        log('Keine Dateiliste von GitHub erhalten', 'warn');
        return;
    }

    files.forEach(file => {

        if (file.type !== 'file' || !file.name.endsWith('.png')) return;

        // i_iconName.png / I_iconName.png → iconName
        const name = file.name
            .replace(/^[iI]_/, '')
            .replace('.png', '');

        const dp = `${dpBase}.${name}`;
        const rawUrl = file.download_url;
        const displayName = name.replace(/_/g, ' ');

        if (!existsState(dp)) {
            createState(dp, rawUrl, {
                name: `inventwoEnergieIcon ${displayName}`,
                type: 'string',
                role: 'url',
                read: true,
                write: false
            });
        } else {
            setState(dp, rawUrl, true);
        }
    });
});
