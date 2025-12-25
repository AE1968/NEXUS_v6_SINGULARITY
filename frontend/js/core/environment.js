const Environment = {
    async getContext() {
        const hour = new Date().getHours();
        let timeOfDay = "noapte";
        if (hour >= 5 && hour < 12) timeOfDay = "dimineață";
        else if (hour >= 12 && hour < 18) timeOfDay = "după-amiază";
        else if (hour >= 18 && hour < 22) timeOfDay = "seară";

        return {
            time: new Date().toLocaleTimeString(),
            timeOfDay: timeOfDay,
            platform: navigator.platform,
            status: "Sistem Stabil"
        };
    }
};
