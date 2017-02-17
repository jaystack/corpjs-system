"use strict";
var DependencySorter = require('dependency-sorter');
function assertDependencies(components) {
    components.forEach(function (component) {
        component.dependencies.forEach(function (dep) {
            if (!components.find(function (_a) {
                var name = _a.name;
                return name === dep.component;
            }))
                throw new Error(component.name + " has " + dep.component + " dependency, but it does not exist in the system");
        });
    });
}
exports.assertDependencies = assertDependencies;
function prepare(components) {
    return components.map.apply(components, [function (component) { return ({}); }].concat(component, [depends, component.dependencies.map(function (dep) { return dep.component; })]));
}
exports.prepare = prepare;
function sort(components) {
    if (Array.isArray(components) && components.length === 1)
        return components;
    assertDependencies(components);
    return new DependencySorter({ idProperty: 'name' })
        .sort(prepare(components))
        .map(function (component) { delete component.depends; return component; });
}
exports.__esModule = true;
exports["default"] = sort;
