# XVIZ Conventions

## Stream Naming

Streams are named in accordance with a few simple rules.


### Use file system-like hierarchical names

**Good** - uses path separators

`/system/object/bounds`

`/system/object/velocity`

**Bad** - uses lots of underscores

`system_object_bounds`

### Stream names should not contain ids.

**Good** - one stream for one group of objects

All of the objects go on the same stream, using the `id` field to tell them apart.

`/object`

**Bad** - a stream per object

`/object/123`


## Stream Structure

Data that is optional or can be visualized separately should be put into its own stream:

**Good** - Each piece broken out separately

```
/raw_points
/object/bounds
/object/velocity
/object/points
```

**Bad** - Single stream for entire complex system

```
/object
```
