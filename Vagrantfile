Vagrant.configure(2) do |config|
  config.vm.box = "hashicorp/precise64"

  config.vm.network "forwarded_port", guest: 3000, host: 8080

  config.vm.provision "shell", path: "provision.sh"
end
