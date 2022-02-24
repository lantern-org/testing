FROM ruby:3.0.2

# SHELL ["/bin/bash", "-c"]
RUN apt-get update -qq && \
    apt-get install -y sqlite3 nodejs npm && \
    # npm install --global n && \
    # n latest && \
    npm install --global yarn
WORKDIR /app
COPY Gemfile /app/Gemfile
COPY Gemfile.lock /app/Gemfile.lock
COPY package.json /app/package.json
# gem update --system
RUN bundle install && npm install -g
COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

# CMD ["puma", "-C", "config/puma.rb"]
CMD ["bin/rails", "server", "-b", "0.0.0.0"]
# CMD ["sleep", "1000000000"]
