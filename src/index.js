"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var _this = this;
var events_1 = require('events');
var sort_1 = require('./sort');
var System = (function (_super) {
    __extends(System, _super);
    function System() {
        _super.apply(this, arguments);
        this.components = [];
    }
    System.prototype.updateLast = function (delta) {
        var _this = this;
        this.components = (_a = this.components).map.apply(_a, [function (component, i) { return i === _this.components.length - 1 ? {} : ; }].concat(component, delta));
        var _a;
    };
    return System;
}(events_1.EventEmitter));
exports.System = System;
dependsOn.apply(void 0, deps.concat([(string | System.Dependency)[]]));
this;
{
    this.updateLast({ dependencies: deps.map(createDependency) });
    return this;
}
add(name, string, component, System.Component);
this;
{
    this.components = this.components.concat([
        {}
    ], component, [
        name,
        dependencies,
        []
    ]);
}
return this;
async;
start();
Promise < System.ResourceDescriptor > {
    return: yield start(sort_1["default"](this.components), {}, function () { _this.restart(); })
};
async;
stop();
Promise < void  > {
    return: yield stop(sort_1["default"](this.components).reverse())
};
async;
restart();
Promise < System.ResourceDescriptor > {
    await: this.stop(),
    const: resources = await, this: .start(),
    this: .emit('restart', resources),
    return: resources
};
function createDependency(dep) {
    switch (typeof dep) {
        case 'string': return { component: dep, as: dep };
        case 'object':
            var _a = dep, component = _a.component, as = _a.as, source = _a.source;
            if (!component)
                throw new Error("'component' is required property on dependency component");
            return { component: component, as: as || component, source: source };
        default: throw new Error("Invalid dependency component: " + dep);
    }
}
exports.createDependency = createDependency;
function filterResources(allResources, dependencies) {
    var resources = {};
    Object.keys(allResources).forEach(function (resourceName) {
        var dependency = dependencies.filter(function (dep) { return dep.component === resourceName; })[0] || null;
        if (!dependency)
            return;
        var component = dependency.component, as = dependency.as, source = dependency.source;
        resources[as] = source ? allResources[component][source] : allResources[component];
    });
    return resources;
}
exports.filterResources = filterResources;
function start(_a, resources, restart) {
    return __awaiter(this, void 0, Promise, function* () {
        var first = _a[0], others = _a.slice(1);
        if (!first)
            return resources;
        var resource = yield first.start(filterResources(resources, first.dependencies), restart);
        return yield start.apply(void 0, [others, {}].concat(resources, [[first.name], resource]));
    });
}
exports.start = start;
restart;
function stop(_a) {
    return __awaiter(this, void 0, Promise, function* () {
        var first = _a[0], others = _a.slice(1);
        if (!first)
            return;
        if (first.stop)
            yield first.stop();
        return yield stop(others);
    });
}
exports.stop = stop;
exports.__esModule = true;
exports["default"] = System;
