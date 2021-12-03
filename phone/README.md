# phone emulator

simple RESTful api (probably -- idk what REST actually means)

using `express.js`

```txt
[meth] /path
<- input
 * notes (optional)
-> output
 * notes (optional)

[GET]  /health
<-
-> healthy | unhealthy

[GET]  /status
<-
-> quick status update (route file, sending..., lat/lon location, etc...)

[GET]  /route
<-
-> gpx file route
[PUT]  /route
<- form file == gpx route
-> success/error
[DEL]  /route
<-
-> success/error

[GET]  /test
<-
-> % of route sent | completed statistics | error not started | error other
 * completed statistics (schema TBD):
 *   request { freq, oneof<i,time> }
 *   actual total send time
 *   number of packets sent
 *   log of ingest-server api responses
[POST] /test
<- json:
{
    "freq":int, // milliseconds between sending points
    "rand":int, // milli random factor: [freq-rand,freq+rand] == actual send rate
    "i":int,    // interpolation factor
    "time":int  // total seconds to send points
}
 * requires a route file to start
 * requires ONEOF "i" or "time"
 * IF i=/=null
 *   let n=len(route)
 *   total_time = (i*(n-1)+n)*freq milliseconds
 *   -- range == [ (i*(n-1)+n)*(freq-rand) , (i*(n-1)+n)*(freq+rand) ]
 * IF time=/=null
 *   phone calculates the closest time it can to
 *   evenly subdivide route file based on the given frequency
 *   i = floor( (((time*1000)/freq)-n)/(n-1) )
 *   same deal with randomness returning a range for total_time
-> success/error (and total computed sending time in seconds)
```

docker vars
```txt
name for ingest server (ip-addr,docker name,etc) (gotta know where to send requests)

```
