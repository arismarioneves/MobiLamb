# 🐑 MobiLamb - Jogo de Ovelhas

Um jogo de estratégia para dois jogadores onde ovelhas se movem por terrenos de uma fazenda.

## 📋 Descrição

MobiLamb é um jogo de tabuleiro digital onde dois jogadores controlam ovelhas (uma branca e uma negra) em um tabuleiro 4x4 com 16 terrenos. O objetivo é estratégicamente mover sua ovelha de forma que o oponente não possa mais fazer movimentos válidos.

## 🎮 Como Jogar

### Configuração Inicial
- Tabuleiro 4x4 (16 quadrados)
- Cada quadrado tem um valor específico:
  - 1 quadrado inicial do Jogador 1 🟩
  - 1 quadrado inicial do Jogador 2 🟧
  - 4 quadrados com valor 1 (azul)
  - 4 quadrados com valor 2 (roxo)
  - 4 quadrados com valor 3 (rosa)
  - 2 quadrados com valor 4 (vermelho)

### Regras de Movimento
1. **Primeiro movimento**: Cada jogador pode mover até 4 casas em qualquer direção
2. **Movimentos seguintes**: O jogador move exatamente o número de casas igual ao valor do terreno onde sua ovelha está
3. **Direções**: Movimento em 8 direções (horizontal, vertical e diagonal)
4. **Wraparound**: Se sair de uma borda, aparece na borda oposta da mesma linha/coluna
5. **Terrenos inativos**: Após deixar um terreno, ele se torna cinza e inativo
6. **Bloqueio**: Não pode parar onde o outro jogador está (mas pode passar por cima)

### Vitória
O jogo termina quando um jogador não consegue mais fazer movimentos válidos. O outro jogador é declarado vencedor.

## 🌐 Funcionalidades

- **Interface Web Responsiva**: Funciona em desktop e mobile
- **Sistema de Partidas**: Criar e entrar em partidas com códigos compartilháveis
- **Visual 3D**: Efeitos visuais em CSS 3D para uma experiência imersiva
- **Indicações Visuais**: Movimentos possíveis destacados em dourado
- **Animações**: Transições suaves e efeitos visuais

## 🚀 Como Executar

1. Abra o arquivo `index.html` em qualquer navegador moderno
2. Clique em "Criar Partida" para iniciar um novo jogo
3. Compartilhe o código da partida com outro jogador
4. O outro jogador deve clicar em "Entrar em Partida" e inserir o código
5. Comece a jogar!

## 🎨 Tecnologias

- **HTML5**: Estrutura da aplicação
- **CSS3**: Estilização com efeitos 3D e animações
- **JavaScript ES6+**: Lógica do jogo e interatividade
- **Design Responsivo**: Compatível com dispositivos móveis

## 🎯 Estratégias

- Planeje seus movimentos para deixar o oponente sem opções
- Use terrenos de valor alto para cobrir mais distância
- Considere o wraparound para movimentos surpreendentes
- Tente controlar terrenos centrais para maior mobilidade

---

Desenvolvido com ❤️ para diversão estratégica!