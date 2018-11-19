require 'vagrant-aws'

Vagrant.configure(2) do |config|
  config.vm.define "aws", autostart: false do |aws_vm|
    aws_vm.vm.box = 'dummy'
    aws_vm.vm.provider 'aws' do |aws, override|
      aws.access_key_id = "AKIAINZQHYRF47QYBJOA"
      aws.secret_access_key = "3aacnjlCcAbJzgrcx353c/8Wwas2utjXSx/3Yq9r"
      aws.keypair_name = 'matt_laptop'
      aws.instance_type = "t2.micro"
      aws.region = 'us-east-2'
      aws.ami = 'ami-0f65671a86f061fcd'
      aws.security_groups = ['launch-wizard-1']
      override.ssh.username = 'ubuntu'
      override.ssh.private_key_path = '~/Madison/Research/JDial/matt_laptop.pem'
    end 
  end
  config.vm.network "forwarded_port", guest: 3000, host: 8080

end
