class PhoneJob < ApplicationJob
  queue_as :default

  def perform(*args)
    data = Phone.sync
    if !data.nil?
      ActionCable.server.broadcast("PhoneChannel", data)
    end
  end
end
