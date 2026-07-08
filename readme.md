Baseado no projeto spraytec

##Node versão específica, usar path completo!!
coloque nas variáveis de ambiente (suas, não do sistema):

acrescente c:/SPS/node/v16.18.1 no PATH

crie NODE = c:/SPS/node/v16.18.1/node.exe

no .vscode/lauch.json, incluir
"runtimeExecutable": "\\SPS\\node\\v16.18.1\\node.exe",
na linha antes da "program"

e finalmente 

npm install para instalar o node_modules

se der problema no npm install:

instalar python, com opções de setar os paths

(com git bash, admin)
npm install --global --production windows-build-tools

Se ao rodar der erro node_printer.node is not a valid Win32 application, rodar

npm uninstall @thiagoelg/node-printer

npm install @thiagoelg/node-printer --build-from-source