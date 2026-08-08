# Green Fields — Dark Fantasy Survival Horror

Protótipo de RPG 3D estilizado para navegador, construído com TypeScript, Vite e Babylon.js. O projeto representa uma vertical slice jogável com exploração, classes, combate, progressão, monstros, drops, defesa de base e persistência local.

O objetivo atual é oferecer uma fundação técnica organizada para evolução futura, sem backend, autenticação ou modelos 3D externos.

## Funcionalidades

- Mundo 3D estilizado `green-fields`.
- Câmera ortográfica inclinada que acompanha o personagem.
- Movimentação por teclado e joystick virtual.
- Personagem construído com primitives do Babylon.js.
- Escolha de classe ao iniciar um novo jogo.
- Combate direcionado ao clicar nos monstros.
- Inteligência artificial com perseguição, ataque e retorno ao spawn.
- Navegação A* para contornar árvores e pedras.
- População dinâmica de monstros e respawn aleatório.
- Progressão de level, experiência e atributos.
- Drops de coração e moedas.
- Base central com vida, incursões e Game Over.
- Save e Continue usando LocalStorage.
- HUD, menus de personagem, inventário e painel de debug.
- Regras puras cobertas por testes unitários.

## Tecnologias

- TypeScript com modo strict
- Vite
- Babylon.js
- HTML e CSS
- Vitest
- LocalStorage

## Requisitos

- Node.js 20 ou superior
- npm
- Navegador com suporte a WebGL

## Instalação

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente:

```text
http://localhost:5173
```

## Scripts

```bash
# Servidor de desenvolvimento
npm run dev

# Verificação de tipos
npm run typecheck

# Testes unitários
npm test

# Build de produção
npm run build
```

O resultado do build é criado em `dist/`.

## Controles

### Desktop

- `WASD`: movimentação.
- Setas direcionais: movimentação alternativa.
- Clique em um monstro: atacar o alvo selecionado.
- `Menu`: pausar e abrir as opções do jogo.

### Mobile

- Joystick virtual no canto inferior esquerdo: movimentação analógica.
- Toque em um monstro: atacar o alvo selecionado.

Movimentos diagonais são normalizados para não oferecer velocidade adicional.

## Início do jogo

Ao selecionar `New Game`, o jogador escolhe um tipo de poder:

### Magia

- Dano baseado em Inteligência.
- Fórmula: `intelligence × powerStatMultiplier`.
- Alcance próprio configurável.

### Arqueiro

- Dano baseado em Agilidade.
- Começa com `training-bow` equipado.
- Possui flechas infinitas nesta versão.
- Tem arco e flecha visíveis no modelo.
- Executa animação de preparação, tensionamento da corda e disparo.
- A flecha percorre visualmente o caminho até o alvo.
- Possui alcance maior que Magia e Curandeiro.
- Cada disparo atinge somente o monstro clicado.

### Curandeiro

- Dano baseado em Inteligência.
- Fórmula de dano igual à da Magia nesta etapa.
- Habilidades específicas de cura ainda serão implementadas.

## Atributos

O personagem possui quatro atributos:

- `strength`
- `agility`
- `intelligence`
- `vitality`

Ao subir de level, o jogador recebe pontos configuráveis para distribuir. A tela Character permite adicionar pontos e usar `Reset Stats` para devolver todos os pontos distribuídos.

O reset:

- Restaura os atributos iniciais definidos no `GAME_CONFIG`.
- Devolve os pontos obtidos por level.
- Preserva a classe escolhida.
- Recalcula vida, velocidade, crítico e dano.
- Limita a vida atual ao novo máximo quando necessário.

## Experiência e level

A experiência necessária é calculada por:

```text
requiredXP = currentLevel × multiplierPerLevel
```

Com multiplicador 100:

- Level 1 → 2: 100 XP.
- Level 2 → 3: 200 XP.
- Level 10 → 11: 1.000 XP.
- Level 98 → 99: 9.800 XP.

O XP excedente é preservado após subir de level. No level máximo, o personagem deixa de receber experiência.

Ao subir de level:

- O level é incrementado.
- O personagem recebe pontos de atributo.
- Sua vida máxima aumenta.
- Sua vida é completamente restaurada.
- O modelo brilha temporariamente em dourado.
- A capacidade máxima da base também aumenta.

## Vida do personagem

A fórmula utilizada é:

```text
maxHealth =
  baseHealth
  + ((vitality - 1) × healthPerVitality)
  + ((level - 1) × healthPerLevel)
```

Todos os valores ficam centralizados no `GAME_CONFIG`.

## Velocidade

O bônus percentual total combina level e Agilidade:

```text
levelBonusPercent = level × levelBonusPercent
agilityBonusPercent = agility × agilityBonusPercent
totalBonusPercent = levelBonusPercent + agilityBonusPercent

movementSpeed = baseSpeed × (1 + totalBonusPercent / 100)
```

Com os multiplicadores conceituais de `0,3%` por level e `1,7%` por Agilidade, level 60 e Agilidade 10 resultam em 35% de bônus total.

## Monstros

### Crawler

- Level 1.
- 16 de vida e 22 de dano.
- Ataque melee próximo.
- Movimento rastejante e silhueta humanoide distorcida.
- Aparece em grupos pequenos de dois.
- Detecta o jogador somente quando ele está próximo.
- Persegue por uma distância limitada.
- Retorna ao local onde nasceu quando perde o alvo.

### Wailer

- Level 2.
- 32 de vida e 28 de dano.
- Silhueta muito alta, fina e antinatural.
- Ataque de média distância.
- Movimento lento e cooldown de ataque de 1,8 segundo.
- Aparece individualmente.

Valores de vida, dano, velocidade, cooldown, alcance e experiência ficam em `src/game/config/monstersConfig.ts`.

## Inteligência artificial

Os monstros utilizam os estados:

```text
IDLE
CHASING
ATTACKING
RETURNING
DEAD
```

Árvores e pedras são consideradas obstáculos. O sistema de navegação utiliza A* em uma grade para calcular caminhos e impedir que os monstros atravessem objetos ao:

- Perseguir o jogador.
- Retornar ao spawn.
- Avançar até a base durante uma incursão.

## População e respawn

O `MonsterPopulationSystem` controla:

- Limite global de monstros vivos.
- Limite individual por tipo.
- Peso de seleção de cada tipo.
- Tamanho dos grupos.
- Delay de respawn.
- IDs únicos para instâncias dinâmicas.
- Respawns pendentes.

O `SpawnPositionService` rejeita posições:

- Fora das áreas de spawn.
- Fora do mapa.
- Dentro de safe zones.
- Próximas demais do jogador.
- Dentro de árvores ou pedras.

Quando um monstro nasce, sua nova posição aleatória se torna o `spawnPosition` usado pela IA.

## Drops

### Coração

- Chance global configurável de drop.
- Recupera uma quantidade configurável de HP.
- Nunca ultrapassa a vida máxima.
- Flutua e gira até ser coletado.

### Moedas

Cada monstro possui sua configuração de moedas no `MONSTERS_CONFIG`:

```ts
crawler: {
  coinDrop: { chance: 0.35, amount: 2 },
}

wailer: {
  coinDrop: { chance: 0.5, amount: 4 },
}
```

- Crawler: 35% de chance de derrubar 2 moedas.
- Wailer: 50% de chance de derrubar 4 moedas.
- Moedas aparecem como pickups 3D dourados.
- A coleta acontece por proximidade.
- O total aparece no HUD e é persistido no save.

## Base e incursões

O centro do mapa possui uma base com um núcleo em forma de fogueira.

A vida máxima da base é calculada por:

```text
baseMaxHealth = baseHealth × playerLevel
```

Com vida-base 300:

- Level 1: 300 HP.
- Level 2: 600 HP.
- Level 3: 900 HP.

Quando o jogador sobe de level, a base recebe a capacidade adicional sem apagar o dano sofrido.

As incursões funcionam em ciclos configuráveis:

1. O jogo aguarda `raidIntervalMs`.
2. A incursão começa.
3. Durante `raidDurationMs`, os monstros priorizam o núcleo.
4. Ao terminar, monstros sobreviventes retornam aos seus spawns.
5. Um novo intervalo é iniciado.

O HUD mostra:

- Vida atual e máxima do núcleo.
- Tempo até a próxima incursão.
- Tempo restante durante o ataque.

### Game Over

Quando a vida do núcleo chega a zero:

- O jogo é pausado.
- O save atual é apagado.
- A opção Continue deixa de existir.
- Uma tela de Game Over é exibida.
- O jogador precisa começar novamente e escolher uma classe.

## Save e Continue

O jogo usa LocalStorage com a chave versionada:

```text
simple-rpg-save:v1
```

O snapshot inclui:

- Classe do personagem.
- Posição e mapa.
- Level e XP.
- Vida e atributos.
- Pontos disponíveis.
- Inventário e equipamentos.
- Total de moedas.
- Monstros vivos e seus estados serializáveis.
- Respawns pendentes e tempo restante.
- Vida e cronômetro da base.

Meshes e objetos do Babylon.js nunca são serializados. As entidades visuais são reconstruídas a partir dos dados.

## Configuração

As configurações principais ficam em:

```text
src/game/config/gameConfig.ts
src/game/config/monstersConfig.ts
```

### Exemplos configuráveis

- Level inicial e máximo.
- Atributos iniciais.
- Vida por Vitalidade e por level.
- Velocidade base e bônus percentuais.
- Multiplicador de dano das classes.
- Alcance por classe.
- Cooldown e animação do ataque.
- Velocidade do projétil do Arqueiro.
- Chance e cura dos corações.
- Vida da base.
- Intervalo e duração das incursões.
- Stats, experiência e moedas de cada monstro.
- Limites e delays da população.

Alguns valores podem estar reduzidos ou ampliados durante desenvolvimento para facilitar testes manuais. Consulte os arquivos de configuração para os valores efetivamente ativos.

## Estrutura do projeto

```text
src/
  game/
    Game.ts
    camera/
      GameCamera.ts
    config/
      gameConfig.ts
      monstersConfig.ts
    core/
      GameState.ts
      types.ts
    entities/
      Player.ts
      Monster.ts
    factories/
      MonsterFactory.ts
      WorldObjectFactory.ts
    scenes/
      WorldScene.ts
    systems/
      BaseRaidSystem.ts
      CoinPickupSystem.ts
      CombatSystem.ts
      ExperienceSystem.ts
      HealthPickupSystem.ts
      InputSystem.ts
      MonsterNavigationSystem.ts
      MonsterPopulationSystem.ts
      SaveSystem.ts
      SpawnPositionService.ts
      StatsSystem.ts
    ui/
      Hud.ts
      PauseMenu.ts
      VirtualJoystick.ts
    world/
      worldData.ts
```

## Arquitetura

O projeto mantém dados, regras e representação visual separados:

- `core`: estados serializáveis e tipos compartilhados.
- `config`: números e regras configuráveis.
- `entities`: representação e comportamento das entidades 3D.
- `systems`: regras de domínio e serviços especializados.
- `factories`: criação de entidades e objetos visuais.
- `world`: configuração estática do mapa.
- `scenes`: composição e ciclo de atualização da cena.
- `ui`: HUD, menus e controles HTML/CSS.

Essa separação permite substituir os placeholders por modelos GLB/GLTF sem reescrever as regras de combate, progressão ou save.

## Testes

Os testes cobrem regras como:

- XP necessária, level up, overflow e level máximo.
- Pontos de atributos e reset.
- Vida máxima e cura no level up.
- Dano por classe.
- Alcance do Arqueiro.
- Drops de coração e moedas.
- Limites e respawn da população.
- Validação de spawn.
- Navegação ao redor de obstáculos.
- Ciclo, dano e progressão da base.

Execute:

```bash
npm test
```

## Debug

Quando habilitado, o painel de debug mostra informações como:

- FPS.
- Posição X/Z do jogador.
- Velocidade.
- População total e por tipo.
- Respawns pendentes.
- Estado atual dos monstros.

As áreas de spawn podem ser exibidas no modo development pela configuração correspondente.

## Estado atual e placeholders

Esta versão utiliza primitives do Babylon.js para:

- Personagem.
- Arco e flecha.
- Crawlers.
- Wailers.
- Árvores mortas, pedras molhadas e ruínas.
- Galhos, cercas quebradas, caixas, ossos e o Beacon.
- Corações e moedas.

Ainda não estão implementados:

- Modelos GLB/GLTF definitivos.
- Animações esqueléticas.
- Sistema completo de loot e raridade.
- Upgrades de armas e flechas.
- Habilidades próprias de Magia e Curandeiro.
- Construções e proteções da base.
- Loja ou utilização das moedas.
- Backend, autenticação ou multiplayer.

## Licença e assets

O protótipo não utiliza personagens ou assets protegidos de outros jogos. Os elementos visuais atuais são gerados com primitives em tempo de execução.
