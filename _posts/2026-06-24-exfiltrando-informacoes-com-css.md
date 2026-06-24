---
layout: post
title: "Exfiltrando informações com CSS"
date: 2026-06-24 00:07:00 -0300
author: dsm
tags: [web, css]
excerpt: "a new writing desk for the collective, small, monochrome, in service of words."
---

[ ] Falar de Shadow Root

## introdução

CSS ou *Cascading Style Sheets* é uma linguagem de estilos para construir layouts e definir questões visuais de aplicações principalmente web. O CSS consiste em um fluxo básico de regra onde definimos um seletor e um bloco de declaração do que será aplicado por aquele seletor. Por exemplo, quero que um título da minha página fique da cor vermelha, o código CSS seria:

```css
.title {
    color: red;
}
```

E assim o navegador fará essa leitura e aplicará a cor vermelha ao elemento do site que conter a classe `title`.

Em sites mais complexos podemos esperar CSS mais complexos, por exemplo, eu quero que apenas uma entrade da dados do tipo telefone e que tem a classe `user-input`, aplique uma borda vermelha para indicar visualmente para o usuário que aquele campo é obrigatório, então, podemos esperar algo como:

```css
input[type="tel"][class="user-input"] {
    border: 1px solid red;
}
```

Esse comportamento de aplicar estilos em determinados elementos a depender da condição estabelecida pelo seletor é o que chamamos de **oracle**, algo que pode confirmar o valor de uma condição booleana (falso ou verdadeiro). O conceito de oracle funciona muito bem quando falamos de exfiltração, justamente porque a depender da forma que iremos buscar o dado a ser exfiltrado, primeiro precisamos saber se ele existe e se ele corresponde ao que buscamos, ou seja, um seletor e uma regra.

## SOP, CSP e CSRF

Antes de pensarmos em exfiltrar algo, é de pensar o risco que isso gera visto que é totalmente possível, por isso, atualmente existem diversas proteções embutidas pelos próprios navegadores e outras que podem ser aplicadas em aplicações para ajudar a mitigar esse risco.

SOP ou *Same-Origin Policy* é um mecanismo nativo dos navegadores modernos para garantir que uma requisição de A para B respeite a origem dela e estabeça algumas políticas para entender se aquela requisição é segura ou não. Essa política é baseada na origem, onde avalia-se: `scheme`, `host`e `port`.

| Origin                      | Scheme | Host         | Port | Trusted? |
|-----------------------------|--------|--------------|------|---------|
| https://www.facebook.com/perfil | HTTPS  | facebook.com | 443  | Sim     |
| https://www.facebook.com/amigos | HTTPS  | facebook.com | 443  | Sim     |
| http://www.facebook.com/perfil  | HTTP   | facebook.com | 80   | Não     |
| https://mobile.facebook.com/perfil  | HTTPS   | mobile.facebook.com | 443   | Não     |

Com a tabela acima fica mais fácil de entender como essas políticas são aplicadas. Se analisarmos as duas primeiras linhas dessa tabela, a origem é confiável porque ambas utilizam o esquema HTTPS, são do domínio facebook.com e usam a porta 443, então, entende-se que não há nenhuma política sendo violada.

Todavia, se olhamos para a terceira linha, há duas diferenças que quebram essa política. Primeiro é o esquema, que neste caso é o HTTP. Um outro problema é que por ser uma requisição HTTP, naturalmente ela tende a usar a porta 80, o que também já é uma segunda violação da política. Somando tudo isso, entende-se que não é uma requisição confiável para a origem alvo.

Assim como na quarta linha, que também há uma violação da política, que neste caso é o host diferente. Mesmo que ainda sim seja um subdomínio ligado ao facebook.com, não é exatamente www.facebook.com e sim mobile.facebook.com. Então a política não confia e também não permite que a origem B (mobile.facebook.com) leia a resposta da origem A (facebook.com) via JavaScript.