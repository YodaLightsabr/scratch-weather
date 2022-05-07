export class Queue {
    constructor () {
        this.queue = [];
    }

    push (data) {
        this.queue.push(data);
    }

    handle () {
        if (this.queue.length === 0) return null;
        return this.queue.shift();
    }

    canHandle () {
        return this.queue.length != 0;
    }

    handleInterval (interval, callback) {
        this.callback = callback;
        return setInterval(() => {
            if (this.canHandle()) callback(this.handle());
        }, interval);
    }
}

export function createQueue () {
    return new Queue();
}