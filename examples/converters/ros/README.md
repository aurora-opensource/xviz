# ROS to XVIZ Custom Example

In order to provide the ability to take our ROS support beyond the very basic
users need the ability to customize how ROS data is extracted and mapped into XVIZ.

Some reasons why a user may need to take control:
 - custom messages with message types we do not yet support
 - ROS data spread out across multiple messages
 - To create a fixed application with your UI & Configuration built-in

To make the use of ROS data as easy as possible, and offer as many options to a solution
this example demonstrates how to create both custom off-line conversion and a custom XVIZ Server
that is configured to handle your specific data.

# Quick start

Setup XVIZ and use the example ROS converter.

```
xviz$ yarn bootstrap
xviz$ cd examples/converters/ros

xviz/examples/converters/ros$ yarn
xviz/examples/converters/ros$ yarn server -d <Directory with .bag files> --rosConfig <ros 2 xviz config json>
```
Should see `xvizserver-log: Listening on port 3000`

Next, lets use a test viewer in streetscape.gl to see the results.

In the streetscape.gl repo

```
streetscape.gl$ yarn bootstrap
streetscape.gl$ cd test/apps/viewer
streetscape.gl/test/apps/viewer$ yarn
streetscape.gl/test/apps/viewer$ yarn start-streaming-local
```

Navigate to the url and use the filename as the path in the URL. Assuming a file `sample_data.bag`, then go to http://localhost:8080/sample_data

Note that some characters do not translate without being escaped in a URL.

# Overview
## Making ROS Message Converter

### describe current provided one
### explain how to make one and requirements

## Custom XVIZBag class

### explain why (custom topics and UI config)

## ROS to XVIZ config
### purpose
### how to make a base one

# Making a Custom Convert CLI tool

# Making a Custom Server

