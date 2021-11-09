class PhoneController < ApplicationController
  # we're using phone as an API
  # this is also a closed system, so security is not that important
  skip_before_action :verify_authenticity_token

  def index # GET /phone
    # return all phones
    render :json => Phone.all
  end
  def create # POST /phone
    # create new phone and return it
    # SIDE EFFECT docker container create/start
    render :json => Phone.create_new
  end
  def new # GET /phone/new
    raise ActionController::RoutingError.new('no')
  end
  def edit # GET /phone/:id/edit
    raise ActionController::RoutingError.new('no')
  end
  def show # GET /phone/:id
    render :json => Phone.find(params[:id])
  end
  def update # PATCH/PUT /phone/:id
    # update specific info
    # SIDE EFFECT docker container start
    # (ensure the container is running)
    # render :json => Phone.find(params[:id]).update(phone_params)
    render :json => Phone.find(params[:id])
  end
  def destroy # DELETE /phone/:id
    # SIDE EFFECT docker container stop
    # (ensure the container is stopped)
    render :json => Phone.find(params[:id])
  end

  def sync
    Phone.sync
    render :json => {}
  end

  private
    def phone_params
      # params.require(:article).permit(:title, :body)
      params
    end
end
