# 🐑 MobiLamb

Duelo de estratégia de ovelhas num **quadro branco**. Dois jogadores, no mesmo dispositivo, movem suas ovelhas pelos terrenos até que o oponente fique sem jogadas.

Interface desenhada à mão (estética *whiteboard sketch*), responsiva para desktop e mobile, e instalável como PWA — **funciona 100% offline**.

## 🎮 Como jogar

Menu direto: **Jogar · Tutorial · Créditos**.

### Tabuleiro
4×4 (16 terrenos), embaralhados a cada partida:
- 1 início de **Dolly** (ovelha branca) e 1 início de **Shaun** (ovelha preta)
- 4× terreno **1**, 4× **2**, 4× **3**, 2× **4**

### Regras de movimento
1. **1ª jogada:** até **4 casas** em qualquer direção.
2. **Jogadas seguintes:** exatamente o número do terreno onde sua ovelha está.
3. **Direções:** só horizontal e vertical (pode mudar de direção a cada casa).
4. **Wraparound:** sair de uma borda reaparece na borda oposta.
5. **Terreno usado** fica rabiscado e sai do jogo.
6. **Bloqueio:** não pode parar onde o oponente está (mas pode passar por cima).

### Vitória
Vence quem deixar o oponente **sem jogadas válidas**.

## 🚀 Como executar

É um app estático, **sem build**. Basta abrir `index.html` num navegador moderno — ou servir a pasta:

```bash
npx http-server . -p 8080
# abra http://localhost:8080
```

## 🎨 Tecnologias

- **HTML5 / CSS3 / JavaScript (ES6+)** — sem framework, sem build
- **[rough.js](https://roughjs.com)** — traço feito à mão (tabuleiro, ovelhas, realces)
- **Ícones vetoriais inline** — leves e offline
- **Gochi Hand** + **Patrick Hand** — fontes manuscritas self-hosted (OFL)
- **PWA** — service worker com cache offline

> Todos os assets ficam vendorizados em `assets/` — o jogo roda **100% offline, sem build e sem dependências em tempo de execução**.

## 🎯 Estratégia

- Planeje para deixar o oponente sem opções.
- Terrenos de valor alto cobrem mais distância.
- Use o wraparound para jogadas surpresa.

## 🙌 Créditos

- **Inspiração:** [Collapsi](https://www.youtube.com/watch?v=6vYEHdjlw3g) — Riffle Shuffle & Roll
- **Traço:** [rough.js](https://roughjs.com) · **Fontes:** Gochi Hand, Patrick Hand (OFL)

---

Feito à mão para diversão estratégica 🐑
