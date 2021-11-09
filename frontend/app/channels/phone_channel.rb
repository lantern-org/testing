class PhoneChannel < ApplicationCable::Channel
  def subscribed
    stream_from "PhoneChannel"

    # stop_all_streams
    # stream_from "phone_data"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed

    # stop_all_streams
  end
end
