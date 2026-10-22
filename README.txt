XTREAM API PROXY - NETLIFY (via GitHub)
======================================

ESTE ZIP FOI PREPARADO PARA SER EXTRAIDO NA RAIZ DO REPOSITORIO
QUE SERA PUBLICADO PELO NETLIFY. Os arquivos estao diretamente
na raiz do ZIP, sem pasta intermediaria.

Arquivos:
  _redirects    -> proxy para o DNS original HTTP
  index.html    -> painel de teste no navegador/celular
  README.txt    -> estas instrucoes

COMO PUBLICAR
1. Extraia o ZIP.
2. Envie os arquivos extraidos para o repositorio GitHub conectado ao Netlify.
3. Confirme que _redirects ficou dentro da PASTA PUBLICADA pelo Netlify.
   - Site HTML simples com publish directory na raiz: coloque na raiz.
   - Site com build que publica /dist ou /public: _redirects precisa chegar
     ao diretorio FINAL de publicacao. Ajuste conforme seu projeto.
4. Aguarde o deploy. Abra https://seusite.netlify.app/
5. Consulte por exemplo:
   https://seusite.netlify.app/player_api.php?username=USUARIO&password=SENHA
   https://seusite.netlify.app/player_api.php?username=USUARIO&password=SENHA&action=get_live_categories
   https://seusite.netlify.app/xmltv.php?username=USUARIO&password=SENHA
   https://seusite.netlify.app/get.php?username=USUARIO&password=SENHA&type=m3u_plus&output=ts

PARA TROCAR O DNS
Edite os 3 enderecos no arquivo _redirects, mantendo o protocolo
http:// caso o servidor original so aceite HTTP.

IMPORTANTE
- O Netlify encaminha os parametros da query automaticamente para proxies 200.
- Usa https:// no site publico e http:// na origem (trecho sem criptografia).
- O projeto nao retransmite o video; URLs internas do JSON/playlist podem
  continuar apontando ao DNS original.
- O servidor original pode recusar a conexao feita pelo Netlify, ainda que
  funcione diretamente no navegador. Nenhum teste real de rede foi confirmado.
- Nao compartilhe usuario, senha nem URLs reais; ficam visiveis em links.
- Se ja existir index.html no seu site, NAO o sobrescreva sem querer:
  basta adicionar ou mesclar _redirects no diretorio publicado.
- Outras regras no _redirects existente devem ser preservadas. Coloque as
  tres novas regras antes de um catch-all /*, se houver.

Documentacao oficial:
https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/
https://docs.netlify.com/manage/routing/redirects/redirect-options/
