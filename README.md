# neeo-fritzhome
To allow for Layer2 magic bridge a docker network to the existing physical interface (adapt the subnets and interface to your settings):

docker network create \ --driver=macvlan 
--ip-range=10.173.40.224/27 
--gateway=10.173.40.1 \ --subnet=10.173.40.0/24 
-o parent=eth0 media

Adpat the credential to access your Fritz!Box in fritzservices.js

Build with:

build -t neeo/fritzhome .

and run with

docker run --init --net=media -d -p 6336:6336 --hostname neeo_fritzhome --name neeo_fritzhome neeo/fritzhome
