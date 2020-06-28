# Typescript Destructure Plugin

The TypeScript Language Service Plugin that provides a set of source actions that simplify object destructuring (as well as folding specific properties in spread operator). Also available as a plugin for VSCode.

*🚧 Warning: this package is now in alpha stage, so it may contain bugs. 🚧*


## Why
There is a common style of coding in Javascript/Typescript when you get an object argument for a function input and destructure it, either in the first statement or directly in the arguments. Destructuring is especially [popular](https://github.com/facebook/react/blob/4c6470cb3b821f3664955290cd4c4c7ac0de733a/packages/react-reconciler/src/SchedulerWithReactIntegration.new.js#L19) [in](https://github.com/facebook/react/blob/09348798a912c8682e57c35842aa7a007e13fdb9/packages/react-devtools-shared/src/devtools/views/Profiler/Interactions.js#L48) [React Community](https://github.com/facebook/react/blob/4c6470cb3b821f3664955290cd4c4c7ac0de733a/packages/react-test-renderer/src/ReactTestRenderer.js#L94).

This plugin is designed to help you save time that you spend copying properties from the object.

## How to use it
Almost all source actions (except for the [collapse into rest operator](#collapse-into-rest-operator)) provided by the plugin become available when you set the cursor on or select the variable with an object type. When this condition is met, a lightbulb will appear next to the desired line (check the `editor.lightbulb.enabled` setting) - clicking on it will open the refactorings and source actions menu, where you can pick the desired one. Another way to get this menu is to use `cmd + .` (on mac) or `ctrl + .` (on win) shortcut.

*Note about complex types*: destructuring source actions are only available for object types, so if your variable has, for example, a union type, not all the members of which can be destructured, then source action will not appear. In this case, you should help the compiler by removing unnecessary types from the union:

```typescript
type SomeUnion = { a: 'b' } | number | undefined;

//  ↓ here source action is unavailable since 
//  ↓ number and  undefined cannot be destructured.
let x: SomeUnion;

if (x && typeof x !== number) {
// ↓ we've removed the unwanted types from the union,
// ↓ so here source action is accessible
   x;
}
```

## Features

### Create destructuring assignment
Creates a variable with destructuring assignment of the object fields. At the moment, only constant creation is available - can be revised in the future.

* before: `props`
* after: `const { a, b } = props`

<!-- Features:
1. If the selected variable is an argument of a function without a body, then a block will be added to the function and the destructurization will be added to its start. -->

\!\[destructuring-assignment\]\(images/destructuring-assignment.png\)

### Destructure function parameter
Transforms the function argument into destructurization. 

* before: `(props) => {/* ... */}`
* after: `({ a, b }) => {/* ... */}`

\!\[destructure-parameter\]\(images/destructure-parameter.png\)

### Destructure object property
Since all source actions in this plugin destructure an object only one level deep, it would be good to have a tool for unfolding specific properties. And that's what it is.

* before: `const { a } = { a: { b: 'c' } }`
* after: `const { a: { b } } = { a: { b: 'c' } }`

\!\[destructure-object-property\]\(images/destructure-object-property.png\)

### Collapse into rest operator
Collapses the selected properties of the array into new variable with the rest operator. Reuses an existing rest variable if any exists, or creates a new one.

* before: `const { a, b, c } = { /* ... */ }`
* after: `const { a, ...rest } = { /* ... */ }`

\!\[collapse-into-rest\]\(images/destructure-object-property.png\)

### Unfold the rest operator
Contrary to the previous one: expands rest operator into separate variables.

* before: `const { a, ...rest } = { /* ... */ }`
* after: `const { a, b, c } = { /* ... */ }`

\!\[unfold-rest-operator\]\(images/destructure-object-property.png\)

