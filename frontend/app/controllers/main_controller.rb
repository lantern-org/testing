class MainController < ApplicationController
  def index
    @phones = Phone.where status:'running'
  end
end
