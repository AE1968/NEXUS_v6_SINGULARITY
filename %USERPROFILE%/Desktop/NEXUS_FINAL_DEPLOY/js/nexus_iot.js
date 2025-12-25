/**
 * 🏠 NEXUS IoT HUB v6.0
 * Hardware Abstraction Layer for Smart Devices.
 */

const NexusIoT = {
    devices: [],
    config: {
        cloudUrl: "https://web-production-b215.up.railway.app/api/nexus/iot"
    },

    // === DISCOVERY (CLOUD SYNC) ===
    discoverDevices: async function () {
        console.log("🏠 IoT: Syncing devices with Cloud Hub...");
        try {
            const res = await fetch(this.config.cloudUrl);
            const data = await res.json();

            if (data.devices && data.devices.length > 0) {
                this.devices = data.devices;
            } else {
                // If cloud empty, init defaults
                this.devices = [
                    { id: 'light_1', name: 'Studio Lights', type: 'lighting', status: 'off' },
                    { id: 'thermo_1', name: 'Main Thermostat', type: 'hvac', status: '22C' },
                    { id: 'speaker_1', name: 'Nexus Audio', type: 'speaker', status: 'idle' }
                ];
                // Sync defaults back to cloud
                this.devices.forEach(d => this.updateCloud(d));
            }
        } catch (e) {
            console.warn("🏠 IoT: Cloud Connection Failed. Using defaults.");
            this.devices = [
                { id: 'light_1', name: 'Studio Lights', type: 'lighting', status: 'off' },
                { id: 'thermo_1', name: 'Main Thermostat', type: 'hvac', status: '22C' }
            ];
        }

        const report = `Found ${this.devices.length} devices active (Cloud Synced).`;
        console.log("🏠 IoT:", report);
        return report;
    },

    // === CONTROL ===
    controlDevice: function (deviceId, action) {
        const device = this.devices.find(d => d.id === deviceId || d.name.toLowerCase().includes(deviceId.toLowerCase()));

        if (!device) return "Device not found.";

        // Update State
        device.status = action;
        this.updateCloud(device); // Sync change

        console.log(`🏠 IoT ACTION: Set ${device.name} to ${action}`);

        // Notify Brain
        if (window.NexusNeuralEngine) {
            window.NexusNeuralEngine.receiveSensoryInput('iot_feedback', `Device ${device.name} confirmed status: ${action}`);
        }

        return `${device.name} is now ${action}.`;
    },

    updateCloud: async function (device) {
        try {
            await fetch(this.config.cloudUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(device)
            });
        } catch (e) { console.warn("IoT Cloud Sync Failed"); }
    },

    // === API ===
    getDeviceStatus: function () {
        return this.devices.map(d => `${d.name}: ${d.status}`).join('\n');
    },

    init: function () {
        console.log("🏠 NEXUS IoT v6.0: ONLINE");
        // Auto-discover on boot
        setTimeout(() => this.discoverDevices(), 2000);
    }
};

window.NexusIoT = NexusIoT;
window.addEventListener('load', () => NexusIoT.init());
