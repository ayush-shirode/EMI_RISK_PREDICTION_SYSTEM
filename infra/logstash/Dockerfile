FROM docker.elastic.co/logstash/logstash:8.11.0
USER root
# Pre-create the dead-letter queue directory to prevent NoSuchFileException during plugin startup
RUN mkdir -p /usr/share/logstash/data/dead_letter_queue/main && \
    chown -R logstash:logstash /usr/share/logstash/data/dead_letter_queue
USER logstash
COPY config/logstash.yml /usr/share/logstash/config/logstash.yml
COPY pipeline/ /usr/share/logstash/pipeline/
