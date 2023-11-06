# API Gateway com Lambda Authorizer - FIAP Tech Challenge Fase 3

Projeto com deploy automático na AWS de um API Gateway que intercepta todas as URLs da aplicação e as autentica, caso necessário. A conexão entre o API Gateway e o Load Balancer da aplicação é feito via VPC Link, permitindo que essa stack seja reaproveitada caso outra aplicação precise de funcionalidades semelhantes.

## Requisitos

A aplicação roda usando AWS SAM CLI. Para rodar o projeto inteiro, é necessário:

* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* [Node.js 18](https://nodejs.org/en/), incluindo o `npm` para gestão de dependências
* [Docker](https://hub.docker.com/search/?type=edition&offering=community)

## Como rodar a API localmente

Primeiramente, é necessário montar a imagem com:

```bash
sam build
```

Em seguida, pode-se subir a API com:

```bash
sam local start-api --debug --env-vars=env.json
```

É recomendado usar a flag `--debug` para logs mais completos em caso de erro.

Com isso, aplicação já estará rodando em `GET http://localhost:3000/test` e `POST http://localhost:3000/customer`.

## Como testar

No caso do `GET /test`, o autorizador deve ser ativado. Com isso, temos os seguintes cenários:
1. Não enviou o _header_ `Authorization` >> Não autorizado
2. Enviou o _header_, mas sem valor (ou um espaço em branco) >> Não autorizado
3. Enviou o _header_, mas o CPF não existe na base >> Não autorizado + log de erro
4. Enviou o _header_ e o CPF existe na base >> Autorizado >> Loga o JSON que chegou no _handler_

Já no caso do `POST /customer`, o autorizador jamais será chamado. Portanto, em todos os cenários a requisição será aceita.

## Estrutura do template

O arquivo `template.yaml` cria os seguintes recursos.

### ApiGateway

Um gateway que fica na frente da aplicação, interceptando as requisições e fazendo-as passar por um Lambda Authorizer antes de prosseguir.

A conexão com o Authorizer (`TokenAuthorizerFunction`) é configurada em `Properties -> Auth` e as configurações de interceptação em `Properties -> DefinitionBody`.

#### DefinitionBody

Essa propriedade receber como parâmetro uma configuração no modelo Open API, à qual ajudará a montar as rotas do API Gateway. Com isso, temos mais possibilidades de personalização, entre elas permitir que alguns endpoints não passem pelo autorizador.

Com isso, temos algumas configurações importantes:

- `securitySchemes` configura o Lambda Authorizer, apontando para a função que deve ser executada e qual _header_ ela espera (`Authorization`)
- `x-amazon-apigateway-authorizer` é uma propriedade exclusiva da AWS que configura o autorizador
- `/{proxy+}:` (ou `$default`) é a configuração padrão para todas as rotas que não foram listadas em `path`
- `x-amazon-apigateway-any-method` faz interceptar todos os verbos HTTP
- `security: - TokenAuthorizer: [ ]` aplica o Lambda Authorizer nas rotas
- `x-amazon-apigateway-integration` configura a integração, ou seja, conecta o API Gateway à VPC via VPC Link
- `/customer` configuração exclusiva para essa rota, removendo o autorizador dela

### TokenAuthorizerFunction

Configura o Lambda Authorizer, cujo código está em `src/handlers/tokenAuthorizer.js`.

### DestinationTestFunction e CustomerTestFunction (apenas dev)

São dois endpoints simples usados para testar o Authorizer. Ele cria uma rota em `GET /test` e outra em `POST /customer`. Para mais detalhes, veja seção sobre [como testar](#como-testar)

A _condition_ `DevelopmentOnlyResources` impede sua criação em produção.

### VpcLink

Serve para conectar o API Gateway ao Load Balancer via VPC. Para isso, ele recebe algumas informações, como ID do Security Group, os IDs das Subnets do Load Balancer e o ARN do _listener_ do Load Balancer.

Com isso, ao dar deploy, o API Gateway já irá interceptar as requisições, autorizá-las (se preciso) e redirecionar para o Load Balancer, que por sua vez irá direcionar para as instâncias da aplicação.
