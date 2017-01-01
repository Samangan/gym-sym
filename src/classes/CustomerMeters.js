
class CustomerMeters {
    constructor(customerType) {
        // TODO: These should be used in a more random fashion in stead of absolute thresholds.
        // TODO: These thresholds should start differently depending on the customerType passed in.
        this.social = 50;
        this.boredom = 0;
        this.dirty = 1000; // NOTE: This is about 10 in-game minutes. Seems like a good amount of time to shower.
        this.screenTouch = 500; // how much they use their phone when idling.
    }
}

export default CustomerMeters;
