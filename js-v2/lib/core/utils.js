;(function(global){

    var log = global.log = log = function() {
        /*print to a renderer*/
        let n = this.constructor.name;
        let fn = `%c ${n} `
        var v = [fn, 'background: #DDD; color: #333'];
        for (var i = 0; i < arguments.length; i++) {
            v.push(arguments[i])
        }

        console.log.apply(console, v)
    }


    var mix = global.mix = function(Parent /*, ...mixins*/) {
        // Use slice as node 4 does not support param spread.
        for (var i = 0; i < mix._handlers.length; i++) {
            mix._handlers[i].apply(this, arguments)
        };

        return xmultiple.apply(window, arguments)
    };

    mix._handlers = []

    mix.addHandler = function(f){
        mix._handlers.push(f)
    }

    mix.removeHandler = function(f){
        var v = mix._handlers.splice( mix._handlers.indexOf(f), 1 )
        return v.length == 1;
    }


    var xmultiple = function xmultiple(...parents) {
        // For now, ensure homogeneous parents
        // That is, objects multi-inherit from objects, and classes multi-inherit from classes
        // In the future, might loosen this restriction, but for now, keeping it simple
        const isEveryParentObject = parents.every(parent => typeof(parent) === 'object');
        const isEveryParentClass = parents.every(parent => typeof(parent) === 'function');

        // Forward to more specialized functions depending on argument types
        if (isEveryParentObject) {
            return xmultipleObjects(parents);
        } else if (isEveryParentClass) {
            return xmultipleClasses(parents);
        } else {
            throw new TypeError('Either every parent should be an ordinary object or every parent should be a class.');
        }
    }

    /**
     * Creates a proxy that delegates to multiple other plain objects.
     *
     * @param {Array<Object>} parents The list of objects to delegate to.
     * @param {any=Object.create(null)} proxyTarget Object for the proxy to
     *     virtualize. Some characteristics of the proxy are verified against the
     *     target. For example, for the proxy to be considered constructible, the
     *     target must be constructible.
     * @return {Proxy}
     */
    var xmultipleObjects = function xmultipleObjects(parents, proxyTarget = Object.create(null)) {
        // Create proxy that traps property accesses and forwards to each parent, returning the first defined value we find
        const forwardingProxy = new Proxy(proxyTarget, {
            get: function (proxyTarget, propertyKey) {
                // The proxy target gets first dibs
                // So, for example, if the proxy target is constructible, this will find its prototype
                if (Object.prototype.hasOwnProperty.call(proxyTarget, propertyKey)) {
                    return proxyTarget[propertyKey];
                }

                // Check every parent for the property key
                // We might find more than one defined value if multiple parents have the same property
                const foundValues = parents.reduce(function(foundValues, parent) {
                    // It's important that we access the object property only once,
                    // because it might be a getter that causes side-effects
                    const currentValue = parent[propertyKey];
                    if (currentValue !== undefined) {
                        foundValues.push(currentValue);
                    }

                    return foundValues;
                }, []);

                // Just because we found multiple values doesn't necessarily mean there's a collision
                // If, for example, we inherit from three plain objects that each inherit from Object.prototype,
                // then we would find three references for the key "hasOwnProperty"
                // But that doesn't mean we have three different functions; it means we have three references to the *same* function
                // Thus, if every found value compares strictly equal, then don't treat it as a collision
                const firstValue = foundValues[0];
                const areFoundValuesSame = foundValues.every(value => value === firstValue);
                if (!areFoundValuesSame) {
                    throw new Error(`Ambiguous property: ${propertyKey}.`);
                }

                return firstValue;
            }
        });

        return forwardingProxy;
    }

    /**
     * Creates a proxy that delegates to multiple other constructor functions and
     * their prototypes.
     *
     * @param {Array<ConstructorFunction>} parents The list of constructor functions
     *     to delegate to.
     * @return {Proxy}
     */
    var xmultipleClasses = function xmultipleClasses(parents) {
        // A dummy constructor because a class can only extend something constructible
        function ConstructibleProxyTarget() {}

        // Replace prototype with a forwarding proxy to parents' prototypes
        ConstructibleProxyTarget.prototype = xmultipleObjects(parents.map(parent => parent.prototype));

        // Forward static calls to parents
        const ClassForwardingProxy = xmultipleObjects(parents, ConstructibleProxyTarget);

        return ClassForwardingProxy;
    }

})(window);
