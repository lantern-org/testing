require 'sidekiq/web'
require 'sidekiq-scheduler/web'

Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root 'main#index'
  get '/main', to: 'main#index'
  resources :phone
  get '/sync', to: 'phone#sync'
  mount Sidekiq::Web => '/sidekiq'
end
