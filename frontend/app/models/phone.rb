class Phone < ApplicationRecord
  # TODO : 3000 -> global variable
  def self.docker_sync
    # SHOULD CALL IN A WORKER THREAD
    puts 'sync docker'
    # PHASE 1: sync state of docker and ruby
    cs = Phone.docker_phones
    puts " docker: %d phones\n   ruby: %d phones" % [cs.length, Phone.all.length]
    # let A = set(port for port in containers)
    # let B = set(port for port in database)
    # if len(A - B) > 0: create database rows
    # if len(B - A) > 0: spawn new containers
    # now we should have A=B
    # pp(cs)
    a = cs.collect{ |c| Phone.name_to_port(c.info["Names"][0]) }.to_set
    b = Phone.all.collect{ |p| p.port }.to_set
    ab = a - b
    ba = b - a
    if ba.length > 0
      puts "- need to spawn new containers"
      # spawn containers which match the port numbers in BA
      ba.to_a.sort.each do |port|
        Phone.docker_container_create(port)
      end
      # re-update container info
      cs = Phone.docker_phones
    end

    # if ab.length > 0
    #   puts "- need to create new database rows"
    #   # create database rows which match the port numbers in AB
    #   ab.to_a.sort.each do |port|
    #     Phone.new(port:port)
    #   end
    # end
    # PHASE 2: update ruby statuses
    cs.sort_by{ |c| c.info["Names"][0] }.each do |c|
      port = Phone.name_to_port(c.info["Names"][0])
      p = Phone.find_by(port:port)
      if p == nil
        p = Phone.new(port:port)
      end
      p.update(d_id:c.id, port:port, status:c.info["State"]) # != "running" then offline
      p.save
    end
    # Phone.all
    # Phone.where status:'running'
  end

  def self.create_new
    if Phone.where(status:'running').length >= 10 # global?
      return nil
    end
    cs = Phone.docker_phones.sort_by{ |c| c.info["Names"][0] }
    cs.each do |c|
      if c.info["State"] != "running"
        # found non-running container, so start it and return it
        c.start
        Phone.docker_sync
        return Phone.find_by(d_id:c.id)
      end
    end
    #
    # if we got here, then all phones are running
    # so we need to make a new one
    port = 3000 + cs.length
    Phone.docker_container_create(port).start
    Phone.new(port:port)
  end

  def self.status_sync
    # MUST CALL IN A WORKER THREAD
    # we only care about the internal status of a running container
    puts 'sync status'
    lst = Phone.where(status:'running')
    lst.map { |c|
      Thread.new {
        url = URI.parse("http://test_phone-emulator_#{c.port-3000}:#{c.port}/status") # make variable?
        req = Net::HTTP::Get.new(url.to_s)
        res = Net::HTTP.start(url.host, url.port, :read_timeout => 1) {|http| # TODO -- FIX
          http.request(req) # blocking
        }
        data = JSON.parse(res.body)
        # update model with data
        puts data
      }
    }.each &:join
    lst
  end

  private
  def self.docker_phones
    Docker::Container.all(all: true, filters: { name: ["phone-emulator"] }.to_json)
  end
  def self.docker_container_create(port)
    Docker::Container.create({
      'Image' => 'phone-emulator',
      'name' => "test_phone-emulator_#{port-3000}",
      'Env' => ["INGEST_URL=#{ENV['INGEST_URL']}","INGEST_PORT=#{ENV['INGEST_PORT']}","ID=#{port-3000}"],
      'HostConfig' => {
        'PortBindings' => {
          "3000/tcp" => [{'HostPort' => "#{port}"}]
        }
        # 0.0.0.0:3001 ?
      }
      # },
      # 'ExposedPorts' => {
      #   "#{port}/tcp" => {}
      # }
    })
  end
  def self.name_to_port(name)
    3000 + name.split("/test_phone-emulator_")[1].to_i
  end
end
