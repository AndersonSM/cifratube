# CifraTube

## Descrição
O CifraTube (http://www.cifratube.com) é um projeto que foi feito para o trabalho de conclusão de curso de Anderson Menezes (Ciência da Computação @ UFCG).  
A cifra é uma notação muito utilizada para aprender músicas, principalmente por músicos amadores. No entanto, não existem ferramentas simples e grátis para criar e acompanhar as cifras de forma interativa junto com a música. Portanto, esse trabalho visa o desenvolvimento de uma ferramenta para cifragem interativa de músicas utilizando vídeos do YouTube, que é uma plataforma popular que permite o acesso à milhões de músicas de forma gratuita. Através dessa ferramenta, os usuários podem aprender músicas de maneira mais fácil e precisa.
  
## Requerimentos
* Node.js 8.x
* MongoDB 4.0

## Instruções para ambiente de desenvolvimento
1. Execute `npm install` na raiz do projeto e na pasta **front**.
2. Para rodar o servidor, execute `node server.js` na raiz.
3. Para rodar o front-end, execute `npm start` na pasta **front**.
5. Acesse `http://localhost:4200`

OBS: O MongoDB deverá estar rodando na porta 27017.

## Instruções para fazer build (produção)
1. Execute `ng build --prod` na pasta **front**.
2. Antes de rodar o servidor, é necessário definir as seguintes variáveis de ambiente:  
   `ENVIRONMENT=production`: Para determinar que é um ambiente de produção  
   `DB_CONNECTION_STRING=mongodb://...`: URL de conexão com o banco de dados
3. Execute `node server.js` na raiz para rodar o servidor. O projeto ficara acessível na porta 8080, que foi definida como padrão.
