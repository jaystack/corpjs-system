# corpjs-system
Start and stop your components in proper order

## Features

### Reused features from Electric by Systemic

- System built on components
- Dependencies between components
- Graceful start and stop

### Additional and enhanced features beyond Electric by Systemic

- Dependencies are controlled globaly
- More descriptive dependencies
  - renaming
  - taking subresources
- Grouping subsystems

### Additional and enhanced features beyond Systemic by corpjs-system

- Type-based
- Promise interface instead of callback interface
- More ergonomic system grouping
- Opportunity for restarting the whole system from any component
- Opportunity for stopping the whole system from any component
- Opportunity for ignorable component errors
- Graceful stop and optional process exit on abnormal behavior
- Graceful SIGINT / SIGTERM termination

## Events

- start
  - `resources: ResourceDescriptor` - all resources of the whole system
- stop
  - `[error]: Error` - error that causes the stop
- restart
  - `resources: ResourceDescriptor` - all resources of the whole system after restart
- componentStart
  - `componentName: String`
  - `resources: ResourceDescriptor` - currently available resources
- componentStartFailed
  - `componentName: String`
  - `error: Error`
- componentStop
  - `componentName: String`
- componentStopFailed
  - `componentName: String`
  - `error: Error`
- componentRunFailed
  - `componentName: String`
  - `error: Error`
- terminate
  - `signal: String`