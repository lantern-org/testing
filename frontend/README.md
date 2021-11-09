# testing console

```console
gem install rails
rails new app --edge --database=sqlite3
cd app
bin/rails generate controller phone
bin/rails generate model phone d_id:string port:integer health:string status:string selected:boolean route:string
bin/rails db:migrate
bin/rails generate controller main index
bin/rails generate job phone
bin/rails generate channel phone
# add awful code
yarn add bootstrap @popperjs/core
```

basically needs to pretty-print a bunch of stuff
while also acting as a direct runtime console

stuff to pretty-print
- (per phone) ingest-server's displayed location (frequency-tunable) on a map
- ingest-server's metrics (post-run)

we can also just do a straight `ab -n 10000 -c 10 http://...` for a single phone
and see how it performs

mostly, we care about seeing how many packets are dropped based on metrics
- number of active UDP streams
- frequency of UDP stream packets
- frequency of API requests (frontend)

will memory (on the ingest-server) become a concern?

`./routes` contains simple gpx route files

we're gonna do a `rails` app. how hard can it be
