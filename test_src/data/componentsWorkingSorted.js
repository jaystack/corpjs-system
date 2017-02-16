"use strict";
var dummyStartFunction = function (resources, restart) {
    return new Promise(function (resolve, reject) {
        return resolve(true);
    });
};
var x = 5;
var componentsWorkingSorted = [
    { name: 'AnotherExistingComponent', dependencies: [], start: dummyStartFunction },
    { name: 'YetAnotherExistingComponent', dependencies: [], start: dummyStartFunction },
    { name: 'ExistingComponent', dependencies: [
            { component: 'AnotherExistingComponent' },
            { component: 'YetAnotherExistingComponent' },
        ], start: dummyStartFunction },
];
exports.__esModule = true;
exports["default"] = componentsWorkingSorted;
