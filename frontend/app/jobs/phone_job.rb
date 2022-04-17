class PhoneJob < ApplicationJob
  queue_as :default

  def perform(*args)
    Phone.docker_sync
    data = Phone.status_sync
    # if !data.nil?
    ActionCable.server.broadcast("PhoneChannel", data)
    # end
  end
end
