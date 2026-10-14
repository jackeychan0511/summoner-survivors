/* ==========================================================================
   js/data.js - 60-Minute Tamer Survivors Data Architecture
   - 3-Tier Pet Evolution (1차 -> 2차 -> 3차 최종 각성)
   - Skill Combination & Evolution Table (합성 진화)
   - 60-Minute Monster Wave Timeline
   ========================================================================== */

const GAME_DATA = {
  // 1. 펫 3종: 1차 -> 2차 -> 3차 전직 트리
  pets: {
    ignis: {
      id: 'ignis',
      name: '이그니스 (아기 드레이크)',
      element: 'fire',
      tier: 1,
      icon: '🔥',
      color: '#f97316',
      accentColor: '#ef4444',
      desc: '화염 속성의 신수. [근거리 버서커] 또는 [원거리 메이지]로 육성할 수 있습니다.',
      baseDamageMul: 1.15,
      startingSkill: 'fireball',
      ultimate: {
        id: 'hellfire_burst',
        name: '지옥불 대폭발',
        icon: '💥',
        cooldown: 14,
        damage: 140,
        desc: '화면 전체의 모든 적에게 폭발 충격파를 가합니다.'
      },
      evolution2: {
        reqLevel: 15,
        id: 'bahamut',
        tier: 2,
        name: '용왕 바하무트 (2차 전직)',
        icon: '🐲',
        color: '#dc2626',
        desc: '고대 화염의 용으로 진화했습니다. 전방위 브레스와 폭발력이 대폭 증가합니다.',
        bonusDamageMul: 1.5,
        unlockSkill: 'dragon_breath'
      },
      evolution3: {
        reqLevel: 35,
        id: 'agni_dragon',
        tier: 3,
        name: '태양신 아그니 드래곤 (3차 최종 각성)',
        icon: '👑',
        color: '#fbbf24',
        desc: '태양의 화신으로 최종 각성했습니다. 영구 불꽃 아우라와 항성 폭발을 일으킵니다.',
        bonusDamageMul: 2.2,
        unlockSkill: 'solar_flare'
      },
      // 스타일별 분기 트리 (근거리 vs 원거리)
      styles: {
        melee: {
          styleId: 'melee',
          styleName: '⚔️ 근거리 버서커 (화염참격)',
          icon: '⚔️',
          badgeColor: '#ef4444',
          desc: '맹렬한 화염 발톱으로 전방의 적들을 찢어가르고 화상을 입히는 근접 파괴형.',
          baseDamageMul: 1.25,
          startingSkill: 'fire_slash',
          ultimate: {
            id: 'flame_charge',
            name: '불꽃 분노 돌격',
            icon: '🔥',
            cooldown: 11,
            damage: 160,
            desc: '전방으로 맹렬히 돌진하며 부딪히는 모든 적을 불태우고 튕겨냅니다.'
          },
          evolution2: {
            reqLevel: 15,
            id: 'bahamut_knight',
            tier: 2,
            name: '용기사 바하무트 (2차 근접)',
            icon: '🐲',
            color: '#ef4444',
            desc: '화룡의 검사로 각성했습니다. 3연속 폭염 할퀴기와 근접 타격력이 대폭 증가합니다.',
            bonusDamageMul: 1.65,
            unlockSkill: 'dragon_claw'
          },
          evolution3: {
            reqLevel: 35,
            id: 'agni_berserker',
            tier: 3,
            name: '업화의 아그니 버서커 (3차 최종)',
            icon: '👑',
            color: '#f59e0b',
            desc: '태양의 화신으로 각성했습니다. 지면을 내리쳐 주변에 거대한 마그마를 분출합니다.',
            bonusDamageMul: 2.4,
            unlockSkill: 'hellfire_eruption'
          },
          recommendedCombo: {
            recipe: '화염 발톱 (Lv.8) + 맹수의 송곳니',
            result: '🌋 마그마 크러셔 (Magma Crusher)',
            desc: '전방 180도 범위를 맹렬하게 강타하며 분화구를 생성하여 지속 폭발을 가합니다.'
          }
        },
        ranged: {
          styleId: 'ranged',
          styleName: '🏹 원거리 메이지 (폭염포격)',
          icon: '🏹',
          badgeColor: '#f97316',
          desc: '장거리 화염구와 강력한 메테오 폭격으로 원거리의 적들을 몰살하는 포격형.',
          baseDamageMul: 1.15,
          startingSkill: 'fireball',
          ultimate: {
            id: 'hellfire_burst',
            name: '지옥불 대폭발',
            icon: '💥',
            cooldown: 14,
            damage: 140,
            desc: '화면 전체의 모든 적에게 폭발 충격파를 가합니다.'
          },
          evolution2: {
            reqLevel: 15,
            id: 'bahamut',
            tier: 2,
            name: '용왕 바하무트 (2차 원거리)',
            icon: '🐲',
            color: '#dc2626',
            desc: '고대 화염의 용으로 진화했습니다. 전방위 브레스와 폭발력이 대폭 증가합니다.',
            bonusDamageMul: 1.5,
            unlockSkill: 'dragon_breath'
          },
          evolution3: {
            reqLevel: 35,
            id: 'agni_dragon',
            tier: 3,
            name: '태양신 아그니 드래곤 (3차 최종)',
            icon: '👑',
            color: '#fbbf24',
            desc: '태양의 화신으로 최종 각성했습니다. 영구 불꽃 아우라와 항성 폭발을 일으킵니다.',
            bonusDamageMul: 2.2,
            unlockSkill: 'solar_flare'
          },
          recommendedCombo: {
            recipe: '화염구 (Lv.8) + 맹수의 송곳니',
            result: '☄️ 헬파이어 메테오 (Hellfire Meteor)',
            desc: '하늘에서 거대한 불타는 운석 3개가 연속 낙하하여 광역 대폭발을 일으킵니다.'
          }
        }
      }
    },

    bolt: {
      id: 'bolt',
      name: '볼트 (썬더 하운드)',
      element: 'lightning',
      tier: 1,
      icon: '⚡',
      color: '#38bdf8',
      accentColor: '#facc15',
      desc: '뇌전 속성의 신수. [근거리 어쌔신] 또는 [원거리 스나이퍼]로 육성할 수 있습니다.',
      baseCooldownRed: 0.15,
      startingSkill: 'chain_lightning',
      ultimate: {
        id: 'thunder_dash',
        name: '전광석화 돌격',
        icon: '⚡',
        cooldown: 10,
        duration: 2.5,
        speedMul: 2.2,
        damage: 40,
        desc: '2.5초간 무적 상태로 초고속 질주하며 부딪히는 적을 감전시킵니다.'
      },
      evolution2: {
        reqLevel: 15,
        id: 'fenrir',
        tier: 2,
        name: '뇌신 펜리르 (2차 전직)',
        icon: '🐺',
        color: '#818cf8',
        desc: '신화의 뇌수(雷獸)로 각성했습니다. 무작위 벼락 폭풍과 이동속도 버프를 부여합니다.',
        bonusCooldownRed: 0.35,
        unlockSkill: 'thunderstorm'
      },
      evolution3: {
        reqLevel: 35,
        id: 'zeus_hound',
        tier: 3,
        name: '창공의 뇌제 제우스 (3차 최종 각성)',
        icon: '⚡',
        color: '#e0e7ff',
        desc: '천상의 벼락을 다스리는 신수로 각성했습니다. 적에게 닿을 때마다 공간 도약 번개를 방출합니다.',
        bonusCooldownRed: 0.50,
        unlockSkill: 'judgment_ray'
      },
      styles: {
        melee: {
          styleId: 'melee',
          styleName: '⚔️ 근거리 어쌔신 (질풍뇌격)',
          icon: '⚔️',
          badgeColor: '#818cf8',
          desc: '눈에 보이지 않는 속도로 전방의 적들을 3연속 베어넘기는 초고속 암살형.',
          baseCooldownRed: 0.20,
          startingSkill: 'thunder_slash',
          ultimate: {
            id: 'thunder_dash',
            name: '전광석화 돌격',
            icon: '⚡',
            cooldown: 10,
            duration: 2.5,
            speedMul: 2.2,
            damage: 40,
            desc: '2.5초간 무적 상태로 초고속 질주하며 부딪히는 적을 감전시킵니다.'
          },
          evolution2: {
            reqLevel: 15,
            id: 'fenrir_assassin',
            tier: 2,
            name: '섀도우 펜리르 (2차 근접)',
            icon: '🐺',
            color: '#818cf8',
            desc: '어둠의 뇌수로 각성했습니다. 적을 X자로 갈라버리는 십자 뇌격참을 해금합니다.',
            bonusCooldownRed: 0.40,
            unlockSkill: 'lightning_cross'
          },
          evolution3: {
            reqLevel: 35,
            id: 'zeus_slayer',
            tier: 3,
            name: '뇌신 제우스 슬레이어 (3차 최종)',
            icon: '⚡',
            color: '#a5b4fc',
            desc: '천벌의 검신으로 각성했습니다. 거대 뇌창을 지면에 내리꽂아 벼락 파동을 일으킵니다.',
            bonusCooldownRed: 0.55,
            unlockSkill: 'zeus_spear'
          },
          recommendedCombo: {
            recipe: '질풍의 뇌인 (Lv.8) + 신속의 호각',
            result: '⚡ 뇌화난무 (Thunder Frenzy)',
            desc: '0.2초마다 전방에 보이지 않는 초고속 뇌격 난무를 펼쳐 화면의 적을 갈아버립니다.'
          }
        },
        ranged: {
          styleId: 'ranged',
          styleName: '🏹 원거리 스나이퍼 (연쇄낙뢰)',
          icon: '🏹',
          badgeColor: '#38bdf8',
          desc: '적들 사이를 튕기는 고전압 연쇄 번개와 벼락 폭풍으로 안전하게 사냥하는 저격형.',
          baseCooldownRed: 0.15,
          startingSkill: 'chain_lightning',
          ultimate: {
            id: 'thunder_dash',
            name: '전광석화 돌격',
            icon: '⚡',
            cooldown: 10,
            duration: 2.5,
            speedMul: 2.2,
            damage: 40,
            desc: '2.5초간 무적 상태로 초고속 질주하며 부딪히는 적을 감전시킵니다.'
          },
          evolution2: {
            reqLevel: 15,
            id: 'fenrir',
            tier: 2,
            name: '뇌신 펜리르 (2차 원거리)',
            icon: '🐺',
            color: '#818cf8',
            desc: '신화의 뇌수로 각성했습니다. 무작위 벼락 폭풍을 소환하여 적들을 강타합니다.',
            bonusCooldownRed: 0.35,
            unlockSkill: 'thunderstorm'
          },
          evolution3: {
            reqLevel: 35,
            id: 'zeus_hound',
            tier: 3,
            name: '창공의 뇌제 제우스 (3차 최종)',
            icon: '⚡',
            color: '#e0e7ff',
            desc: '천상의 벼락을 다스리는 신수로 각성했습니다. 4방향 심판의 레이저포를 회전 발사합니다.',
            bonusCooldownRed: 0.50,
            unlockSkill: 'judgment_ray'
          },
          recommendedCombo: {
            recipe: '연쇄 번개 (Lv.8) + 신속의 호각',
            result: '⚡ 뇌전망 테슬라 (Tesla Web)',
            desc: '최대 10마리의 적에게 고전압 번개가 튕기며 1초간 마비시킵니다.'
          }
        }
      }
    },

    sylph: {
      id: 'sylph',
      name: '실피드 (숲의 수호 슬라임)',
      element: 'nature',
      tier: 1,
      icon: '🌿',
      color: '#22c55e',
      accentColor: '#10b981',
      desc: '자연 속성의 신수. [근거리 가디언] 또는 [원거리 레인저]로 육성할 수 있습니다.',
      baseMagnetBonus: 50,
      startingSkill: 'thorn_aura',
      ultimate: {
        id: 'divine_barrier',
        name: '대지의 수호 성벽',
        icon: '🛡️',
        cooldown: 16,
        duration: 5.0,
        heal: 25,
        desc: '5초간 무적 보호막 생성 + 테이머 HP 25 즉시 회복 + 주변 적 넉백'
      },
      evolution2: {
        reqLevel: 15,
        id: 'yggdrasil',
        tier: 2,
        name: '숲의 거신 이그드라 (2차 전직)',
        icon: '🌳',
        color: '#15803d',
        desc: '세계수의 수호신으로 진화했습니다. 절대 성역 장판을 펼쳐 아군을 치유하고 적을 밀어냅니다.',
        bonusMagnetBonus: 100,
        unlockSkill: 'sanctuary'
      },
      evolution3: {
        reqLevel: 35,
        id: 'gaia_goddess',
        tier: 3,
        name: '영원의 어머니 가이아 (3차 최종 각성)',
        icon: '🌸',
        color: '#f472b6',
        desc: '만물의 창조신으로 최종 승천했습니다. 테이머 사망 시 즉시 100% 부활 + 파티 무적 장판 전개.',
        bonusMagnetBonus: 180,
        unlockSkill: 'life_rebirth'
      },
      styles: {
        melee: {
          styleId: 'melee',
          styleName: '⚔️ 근거리 가디언 (가시성역)',
          icon: '⚔️',
          badgeColor: '#10b981',
          desc: '접근하는 모든 적에게 가시 덩굴 반사 피해를 입히고 치유 장판으로 버티는 방어형.',
          baseMagnetBonus: 60,
          startingSkill: 'thorn_aura',
          ultimate: {
            id: 'divine_barrier',
            name: '대지의 수호 성벽',
            icon: '🛡️',
            cooldown: 16,
            duration: 5.0,
            heal: 25,
            desc: '5초간 무적 보호막 생성 + 테이머 HP 25 즉시 회복 + 주변 적 넉백'
          },
          evolution2: {
            reqLevel: 15,
            id: 'yggdrasil',
            tier: 2,
            name: '숲의 거신 이그드라 (2차 근접)',
            icon: '🌳',
            color: '#15803d',
            desc: '세계수의 수호신으로 진화했습니다. 절대 성역 장판을 펼쳐 아군을 치유하고 적을 밀어냅니다.',
            bonusMagnetBonus: 110,
            unlockSkill: 'sanctuary'
          },
          evolution3: {
            reqLevel: 35,
            id: 'gaia_goddess',
            tier: 3,
            name: '영원의 어머니 가이아 (3차 최종)',
            icon: '🌸',
            color: '#f472b6',
            desc: '만물의 창조신으로 최종 승천했습니다. 초재생 장판과 불멸의 보호막을 부여합니다.',
            bonusMagnetBonus: 200,
            unlockSkill: 'life_rebirth'
          },
          recommendedCombo: {
            recipe: '가시 덩굴 (Lv.8) + 자석 수정',
            result: '🥀 흡혈의 장미 (Vampiric Rose)',
            desc: '초대형 가시 장판과 회전 장미 꽃잎이 적을 분쇄하며 준 피해의 10%를 흡혈합니다.'
          }
        },
        ranged: {
          styleId: 'ranged',
          styleName: '🏹 원거리 레인저 (칼날잎사귀)',
          icon: '🏹',
          badgeColor: '#22c55e',
          desc: '날카로운 관통 잎사귀 표창과 맹독 포자 폭탄으로 원거리에서 적을 제압하는 사수형.',
          baseMagnetBonus: 40,
          startingSkill: 'leaf_cutter',
          ultimate: {
            id: 'nature_arrow',
            name: '세계수의 저격화살',
            icon: '🏹',
            cooldown: 12,
            damage: 150,
            desc: '전방 일직선상의 모든 적을 관통하는 거대한 녹색 에너지 화살을 발사합니다.'
          },
          evolution2: {
            reqLevel: 15,
            id: 'sylph_fairy',
            tier: 2,
            name: '요정왕 실피르 (2차 원거리)',
            icon: '🧚',
            color: '#34d399',
            desc: '숲의 정령왕으로 각성했습니다. 유도형 맹독 포자를 투척하여 독지대를 생성합니다.',
            bonusMagnetBonus: 90,
            unlockSkill: 'poison_spore'
          },
          evolution3: {
            reqLevel: 35,
            id: 'celestial_gaia',
            tier: 3,
            name: '천상의 정령신 가이아 (3차 최종)',
            icon: '🌸',
            color: '#fb7185',
            desc: '자연의 신으로 최종 각성했습니다. 화면 전체를 뒤덮는 꽃보라 태풍을 휘몰아칩니다.',
            bonusMagnetBonus: 170,
            unlockSkill: 'celestial_tempest'
          },
          recommendedCombo: {
            recipe: '칼날 잎사귀 (Lv.8) + 유대의 방울',
            result: '🍃 질풍의 꽃보라 (Floral Tempest)',
            desc: '8방향으로 무한 회전하며 퍼져나가는 꽃잎 칼날 폭풍으로 전방위 적을 난도질합니다.'
          }
        }
      }
    }
  },

  // 2. 스킬(무기) 레지스트리 (기본 스킬 + 전직 스킬 + 합성 진화 스킬)
  skills: {
    // --- [1] 기본 액티브 스킬 ---
    fireball: {
      id: 'fireball',
      name: '화염구 (Fireball)',
      element: 'fire',
      type: 'projectile_explode',
      icon: '🔥',
      desc: '가장 가까운 적에게 폭발하는 화염구를 발사합니다.',
      maxLevel: 8,
      baseCooldown: 1.2,
      baseDamage: 28,
      speed: 8,
      explodeRadius: 45
    },
    chain_lightning: {
      id: 'chain_lightning',
      name: '연쇄 번개 (Chain Lightning)',
      element: 'lightning',
      type: 'chain',
      icon: '⚡',
      desc: '적에게 번개를 쏘아 주변 적들에게 3회 연쇄 감전시킵니다.',
      maxLevel: 8,
      baseCooldown: 0.9,
      baseDamage: 20,
      chains: 3,
      range: 160
    },
    thorn_aura: {
      id: 'thorn_aura',
      name: '가시 덩굴 (Thorn Aura)',
      element: 'nature',
      type: 'aura',
      icon: '🌿',
      desc: '펫 주변에 회전하는 가시 장판을 생성해 접근하는 적을 공격합니다.',
      maxLevel: 8,
      baseCooldown: 0.5,
      baseDamage: 12,
      radius: 75
    },
    magic_satellite: {
      id: 'magic_satellite',
      name: '정령 위성 (Spirits)',
      element: 'arcane',
      type: 'orbital',
      icon: '✨',
      desc: '테이머와 펫 주변을 빠르게 회전하며 부딪히는 적을 튕겨냅니다.',
      maxLevel: 8,
      baseCooldown: 3.0,
      baseDamage: 16,
      count: 2,
      radius: 80
    },
    icicle_spear: {
      id: 'icicle_spear',
      name: '고드름 창 (Icicle Spear)',
      element: 'ice',
      type: 'ice_projectile',
      icon: '🧊',
      desc: '날카로운 얼음 창을 투척하여 적을 관통하고 2초간 이동속도를 40% 감속시킵니다.',
      maxLevel: 8,
      baseCooldown: 1.4,
      baseDamage: 24,
      speed: 8.5,
      pierce: 3
    },
    wind_blade: {
      id: 'wind_blade',
      name: '바람의 칼날 (Wind Blade)',
      element: 'wind',
      type: 'spiral_blade',
      icon: '🌪️',
      desc: '테이머 주변을 나선형으로 회전하며 뻗어나가는 관통형 칼날 바람을 발사합니다.',
      maxLevel: 8,
      baseCooldown: 2.2,
      baseDamage: 22,
      count: 3
    },
    holy_cross: {
      id: 'holy_cross',
      name: '신성한 십자가 (Holy Cross)',
      element: 'holy',
      type: 'boomerang',
      icon: '✝️',
      desc: '적을 관통하며 날아갔다가 테이머를 향해 부메랑처럼 되돌아오며 2차 타격을 입힙니다.',
      maxLevel: 8,
      baseCooldown: 2.0,
      baseDamage: 32,
      speed: 7.0
    },
    dark_minion: {
      id: 'dark_minion',
      name: '해골 소환수 (Dark Minion)',
      element: 'dark',
      type: 'summon_minion',
      icon: '💀',
      desc: '테이머 곁을 지키며 주변 적에게 돌진하여 지속 난무 공격을 가하는 해골 전사를 소환합니다.',
      maxLevel: 8,
      baseCooldown: 1.0,
      baseDamage: 18,
      count: 2
    },

    // --- [2] 2차 전직 해금 스킬 ---
    dragon_breath: {
      id: 'dragon_breath',
      name: '용의 숨결 (Dragon Breath)',
      element: 'fire',
      type: 'cone_spray',
      icon: '🐲',
      desc: '[2차 전직] 펫 전방으로 지속적인 고열 화염을 방사하여 적들을 녹입니다.',
      maxLevel: 8,
      baseCooldown: 2.5,
      baseDamage: 40,
      duration: 1.2,
      range: 130
    },
    thunderstorm: {
      id: 'thunderstorm',
      name: '뇌전 폭풍 (Thunderstorm)',
      element: 'lightning',
      type: 'random_strike',
      icon: '⛈️',
      desc: '[2차 전직] 하늘에서 전장의 무작위 적 3체 위로 거대한 벼락을 내리꽂습니다.',
      maxLevel: 8,
      baseCooldown: 2.0,
      baseDamage: 55,
      count: 3
    },
    sanctuary: {
      id: 'sanctuary',
      name: '세계수의 성역 (Sanctuary)',
      element: 'nature',
      type: 'sanctuary_field',
      icon: '🌳',
      desc: '[2차 전직] 초대형 신성 장판을 전개하여 적을 넉백시키고 테이머의 HP를 회복합니다.',
      maxLevel: 8,
      baseCooldown: 3.5,
      baseDamage: 30,
      radius: 140,
      healAmount: 8
    },

    // --- [3] 3차 최종 각성 전용 스킬 ---
    solar_flare: {
      id: 'solar_flare',
      name: '태양의 플레어 (Solar Flare)',
      element: 'fire',
      type: 'screen_nova',
      icon: '☀️',
      desc: '[3차 각성] 화면 전체에 초열 플레어를 폭발시켜 모든 적에게 궤멸적 피해를 입힙니다.',
      maxLevel: 5,
      baseCooldown: 4.0,
      baseDamage: 120
    },
    judgment_ray: {
      id: 'judgment_ray',
      name: '천벌의 뇌광 (Judgment Ray)',
      element: 'lightning',
      type: 'laser_sweep',
      icon: '⚡',
      desc: '[3차 각성] 펫 전방 360도로 회전하는 초고압 뇌광 빔을 발사하여 적들을 분쇄합니다.',
      maxLevel: 5,
      baseCooldown: 3.5,
      baseDamage: 90
    },
    life_rebirth: {
      id: 'life_rebirth',
      name: '생명의 숨결 (Life Rebirth)',
      element: 'nature',
      type: 'passive_aura',
      icon: '🌸',
      desc: '[3차 각성] 1초마다 모든 아군의 HP를 5 회복하고, 30초마다 즉사 방지 보호막을 생성합니다.',
      maxLevel: 5,
      baseCooldown: 1.0,
      healAmount: 5
    },

    // --- [4] 🔥 상위 합성 진화 스킬 (Evolved Skills) ---
    hellfire_meteor: {
      id: 'hellfire_meteor',
      name: '☄️ 헬파이어 메테오 (Hellfire Meteor)',
      isEvolved: true,
      element: 'fire',
      type: 'falling_meteor',
      icon: '☄️',
      desc: '[합성 진화: 화염구+송곳니] 거대 운석이 연속 낙하하여 3연속 대폭발과 용암 지대를 형성합니다.',
      maxLevel: 1,
      baseCooldown: 1.8,
      baseDamage: 85,
      radius: 80
    },
    tesla_web: {
      id: 'tesla_web',
      name: '⚡ 뇌전망 테슬라 (Tesla Web)',
      isEvolved: true,
      element: 'lightning',
      type: 'chain_mega',
      icon: '🕸️',
      desc: '[합성 진화: 연쇄번개+호각] 10마리의 적을 0.1초 만에 연속 감전시키고 1초간 마비시킵니다.',
      maxLevel: 1,
      baseCooldown: 0.8,
      baseDamage: 50,
      chains: 10,
      range: 240
    },
    vampiric_rose: {
      id: 'vampiric_rose',
      name: '🥀 흡혈의 장미 (Vampiric Rose)',
      isEvolved: true,
      element: 'nature',
      type: 'aura_leech',
      icon: '🥀',
      desc: '[합성 진화: 가시덩굴+수정] 거대 가시 장판이 펼쳐지며, 적에게 준 피해의 10%를 흡혈합니다.',
      maxLevel: 1,
      baseCooldown: 0.4,
      baseDamage: 25,
      radius: 110,
      leechPct: 0.10
    },
    supernova_orbital: {
      id: 'supernova_orbital',
      name: '🌌 초신성 오비탈 (Supernova)',
      isEvolved: true,
      element: 'arcane',
      type: 'orbital_mega',
      icon: '🌌',
      desc: '[합성 진화: 정령위성+방울] 4개의 거대 항성이 궤도를 돌며 접근하는 모든 적을 튕겨내고 탄환을 소멸시킵니다.',
      maxLevel: 1,
      baseCooldown: 2.0,
      baseDamage: 38,
      count: 4,
      radius: 105
    },
    absolute_blizzard: {
      id: 'absolute_blizzard',
      name: '❄️ 절대영도 블리자드 (Blizzard)',
      isEvolved: true,
      element: 'ice',
      type: 'screen_blizzard',
      icon: '❄️',
      desc: '[합성 진화: 고드름창+현자의고서] 전장에 상시 눈보라를 일으켜 모든 적을 지속 동결 및 빙결 폭발시킵니다.',
      maxLevel: 1,
      baseCooldown: 1.5,
      baseDamage: 48,
      slowPct: 0.6
    },
    typhoon_vortex: {
      id: 'typhoon_vortex',
      name: '🌀 타이푼 볼텍스 (Typhoon)',
      isEvolved: true,
      element: 'wind',
      type: 'storm_vortex',
      icon: '🌀',
      desc: '[합성 진화: 바람칼날+유대의방울] 2개의 거대한 태풍이 전장을 휩쓸며 적들을 빨아들여 분쇄합니다.',
      maxLevel: 1,
      baseCooldown: 2.0,
      baseDamage: 55,
      duration: 3.0
    },
    celestial_blade: {
      id: 'celestial_blade',
      name: '⚔️ 천상의 심판도끼 (Celestial Blade)',
      isEvolved: true,
      element: 'holy',
      type: 'cross_axes',
      icon: '⚔️',
      desc: '[합성 진화: 신성십자가+네잎클로버] 4방향으로 거대한 황금 도끼가 회전 방사되며 100% 치명타 폭발을 일으킵니다.',
      maxLevel: 1,
      baseCooldown: 1.6,
      baseDamage: 90
    },
    abyss_necromancer: {
      id: 'abyss_necromancer',
      name: '👑 사령의 지옥군주 (Abyss Lord)',
      isEvolved: true,
      element: 'dark',
      type: 'summon_giant',
      icon: '👑',
      desc: '[합성 진화: 해골소환수+송곳니] 거대한 해골 군주가 전장에 상시 강림하여 거대한 검기로 광역 참격을 가합니다.',
      maxLevel: 1,
      baseCooldown: 0.9,
      baseDamage: 75
    },

    // --- [근거리/원거리 신규 특화 스킬 & 전직기 & 합성 진화] ---
    fire_slash: {
      id: 'fire_slash',
      name: '화염 발톱 (Fire Claw)',
      element: 'fire',
      type: 'melee_slash',
      icon: '🔥',
      desc: '전방 부채꼴 범위로 맹렬한 불꽃 발톱을 휘둘러 베어가르고 화상을 입힙니다.',
      maxLevel: 8,
      baseCooldown: 0.9,
      baseDamage: 28,
      range: 95
    },
    dragon_claw: {
      id: 'dragon_claw',
      name: '용왕의 찢어발기기 (Dragon Claw)',
      element: 'fire',
      type: 'melee_slash_multi',
      icon: '🐲',
      desc: '[2차 근접] 전방으로 3연속 거대 폭염 발톱을 난무하여 적들을 분쇄합니다.',
      maxLevel: 8,
      baseCooldown: 1.4,
      baseDamage: 45,
      range: 125
    },
    hellfire_eruption: {
      id: 'hellfire_eruption',
      name: '업화의 분화구 (Hellfire Eruption)',
      element: 'fire',
      type: 'ground_eruption',
      icon: '🌋',
      desc: '[3차 최종] 지면을 내리쳐 주변 360도에 마그마 기둥을 솟구치게 하여 대폭발을 일으킵니다.',
      maxLevel: 8,
      baseCooldown: 2.2,
      baseDamage: 80,
      radius: 160
    },
    magma_crusher: {
      id: 'magma_crusher',
      name: '🌋 마그마 크러셔 (Magma Crusher)',
      isEvolved: true,
      element: 'fire',
      type: 'crusher_slash',
      icon: '🌋',
      desc: '[합성 진화: 화염발톱+송곳니] 전방 180도 범위를 파괴적으로 강타하며 마그마 분화구를 폭발시킵니다.',
      maxLevel: 1,
      baseCooldown: 1.1,
      baseDamage: 95,
      range: 140
    },

    thunder_slash: {
      id: 'thunder_slash',
      name: '질풍의 뇌인 (Thunder Slash)',
      element: 'lightning',
      type: 'melee_slash_fast',
      icon: '⚡',
      desc: '전방으로 보이지 않는 속도로 3연속 쾌속 뇌격 참격을 가합니다.',
      maxLevel: 8,
      baseCooldown: 0.7,
      baseDamage: 22,
      range: 90
    },
    lightning_cross: {
      id: 'lightning_cross',
      name: '십자 뇌격참 (Lightning Cross)',
      element: 'lightning',
      type: 'cross_slash',
      icon: '⚔️',
      desc: '[2차 근접] 전방의 적들을 X자 형태로 베어넘기며 십자 벼락 충격파를 방출합니다.',
      maxLevel: 8,
      baseCooldown: 1.2,
      baseDamage: 48,
      range: 130
    },
    zeus_spear: {
      id: 'zeus_spear',
      name: '뇌신의 심판창 (Zeus Spear)',
      element: 'lightning',
      type: 'spear_slam',
      icon: '🔱',
      desc: '[3차 최종] 천상의 뇌창을 지면에 내리꽂아 반경 180px 내의 모든 적을 일격 감전시킵니다.',
      maxLevel: 8,
      baseCooldown: 1.8,
      baseDamage: 85,
      radius: 180
    },
    thunder_frenzy: {
      id: 'thunder_frenzy',
      name: '⚡ 뇌화난무 (Thunder Frenzy)',
      isEvolved: true,
      element: 'lightning',
      type: 'frenzy_slashes',
      icon: '⚡',
      desc: '[합성 진화: 뇌인+호각] 0.15초마다 전방에 무수한 뇌격 잔상을 베어내어 적들을 산산조각냅니다.',
      maxLevel: 1,
      baseCooldown: 0.6,
      baseDamage: 60,
      range: 135
    },

    leaf_cutter: {
      id: 'leaf_cutter',
      name: '칼날 잎사귀 (Leaf Cutter)',
      element: 'nature',
      type: 'spread_projectile',
      icon: '🍃',
      desc: '전방으로 관통하는 날카로운 잎사귀 표창 3발을 부채꼴로 동시 투척합니다.',
      maxLevel: 8,
      baseCooldown: 1.2,
      baseDamage: 20,
      speed: 7.5,
      count: 3
    },
    poison_spore: {
      id: 'poison_spore',
      name: '맹독 포자 폭탄 (Poison Spore)',
      element: 'nature',
      type: 'toxic_bomb',
      icon: '🍄',
      desc: '[2차 원거리] 유도형 독포자를 던져 착탄 지점에 3초간 지속되는 맹독 웅덩이를 생성합니다.',
      maxLevel: 8,
      baseCooldown: 2.0,
      baseDamage: 35,
      radius: 100
    },
    celestial_tempest: {
      id: 'celestial_tempest',
      name: '천상의 꽃보라 (Celestial Tempest)',
      element: 'nature',
      type: 'tempest_storm',
      icon: '🌸',
      desc: '[3차 최종] 화면 전체를 뒤덮는 성스러운 벚꽃 폭풍을 일으켜 모든 적을 지속 타격합니다.',
      maxLevel: 8,
      baseCooldown: 2.5,
      baseDamage: 65,
      radius: 260
    },
    floral_tempest: {
      id: 'floral_tempest',
      name: '🍃 질풍의 꽃보라 (Floral Tempest)',
      isEvolved: true,
      element: 'nature',
      type: 'spiral_petals',
      icon: '🌸',
      desc: '[합성 진화: 잎사귀+방울] 8방향으로 무한 회전하며 퍼져나가는 꽃잎 칼날 폭풍으로 전방위 적을 난도질합니다.',
      maxLevel: 1,
      baseCooldown: 1.2,
      baseDamage: 55,
      count: 8
    }
  },

  // 3. 패시브 아이템 (장신구)
  passives: {
    beast_fang: {
      id: 'beast_fang',
      name: '야수의 송곳니 (공격력)',
      icon: '🦷',
      desc: '펫의 모든 스킬 공격력이 15% 증가합니다. (화염구 / 해골소환수 진화 재료)',
      stat: 'might',
      amount: 0.15,
      maxLevel: 5
    },
    speed_whistle: {
      id: 'speed_whistle',
      name: '바람의 호각 (쿨타임 감소)',
      icon: '🪈',
      desc: '펫의 스킬 쿨타임이 10% 감소합니다. (연쇄번개 진화 재료)',
      stat: 'cooldown',
      amount: 0.10,
      maxLevel: 5
    },
    magnet_gem: {
      id: 'magnet_gem',
      name: '인력의 수정 (자석 범위)',
      icon: '🧲',
      desc: '경험치 보석 흡입 거리가 50px 증가합니다. (가시덩굴 진화 재료)',
      stat: 'magnet',
      amount: 50,
      maxLevel: 5
    },
    friendship_bell: {
      id: 'friendship_bell',
      name: '유대의 방울 (이동속도)',
      icon: '🔔',
      desc: '테이머와 펫의 이동속도가 15% 빨라집니다. (정령위성 / 바람칼날 진화 재료)',
      stat: 'speed',
      amount: 0.15,
      maxLevel: 5
    },
    four_leaf_clover: {
      id: 'four_leaf_clover',
      name: '행운의 네잎클로버 (치명타율)',
      icon: '🍀',
      desc: '치명타 확률이 12% 증가하며 2배 피해를 입힙니다. (신성십자가 진화 재료)',
      stat: 'crit',
      amount: 0.12,
      maxLevel: 5
    },
    sage_tome: {
      id: 'sage_tome',
      name: '현자의 고서 (경험치 보너스)',
      icon: '📖',
      desc: '경험치 보석 획득량이 20% 증가합니다. (고드름창 진화 재료)',
      stat: 'exp',
      amount: 0.20,
      maxLevel: 5
    }
  },

  // 4. 🧬 합성 진화 조합 공식표 (총 11대 합성 진화!)
  evolutionRecipes: [
    { baseSkill: 'fireball', reqPassive: 'beast_fang', result: 'hellfire_meteor' },
    { baseSkill: 'fire_slash', reqPassive: 'beast_fang', result: 'magma_crusher' },
    { baseSkill: 'chain_lightning', reqPassive: 'speed_whistle', result: 'tesla_web' },
    { baseSkill: 'thunder_slash', reqPassive: 'speed_whistle', result: 'thunder_frenzy' },
    { baseSkill: 'thorn_aura', reqPassive: 'magnet_gem', result: 'vampiric_rose' },
    { baseSkill: 'leaf_cutter', reqPassive: 'friendship_bell', result: 'floral_tempest' },
    { baseSkill: 'magic_satellite', reqPassive: 'friendship_bell', result: 'supernova_orbital' },
    { baseSkill: 'icicle_spear', reqPassive: 'sage_tome', result: 'absolute_blizzard' },
    { baseSkill: 'wind_blade', reqPassive: 'friendship_bell', result: 'typhoon_vortex' },
    { baseSkill: 'holy_cross', reqPassive: 'four_leaf_clover', result: 'celestial_blade' },
    { baseSkill: 'dark_minion', reqPassive: 'beast_fang', result: 'abyss_necromancer' }
  ],

  // 5. 🗺️ 뱀파이어 서바이벌급 초대형 월드 맵 (16000 x 16000)
  world: {
    width: 16000,
    height: 16000,
    landmarks: [
      { name: '고대 마법진 (중앙 성소)', x: 8000, y: 8000, radius: 280, color: '#38bdf8' },
      { name: '북서쪽 암흑 묘지', x: 3500, y: 3500, radius: 240, color: '#a855f7' },
      { name: '북동쪽 번개 신전', x: 12500, y: 3500, radius: 240, color: '#facc15' },
      { name: '남서쪽 세계수의 숲', x: 3500, y: 12500, radius: 240, color: '#22c55e' },
      { name: '남동쪽 용의 제단', x: 12500, y: 12500, radius: 240, color: '#ef4444' }
    ]
  },

  // 6. 🛡️ 테이머 3종 장비 시스템 (무기 1 / 갑옷 1 / 방패 1)
  equipments: {
    // [1] 무기 (Weapon)
    weapon_1: { id: 'weapon_1', slot: 'weapon', tier: 1, name: '초심자의 마도 지팡이', icon: '🪄', color: '#94a3b8', desc: '공격력 +20%, 탄속 +15%', mightBonus: 0.20, speedBonus: 0.15 },
    weapon_2: { id: 'weapon_2', slot: 'weapon', tier: 2, name: '고대 유적의 마력봉', icon: '🔮', color: '#38bdf8', desc: '공격력 +45%, 탄속 +30%, 쿨타임 -10%', mightBonus: 0.45, speedBonus: 0.30, cdrBonus: 0.10 },
    weapon_3: { id: 'weapon_3', slot: 'weapon', tier: 3, name: '성검의 마법검 엑스칼리버', icon: '🗡️', color: '#facc15', desc: '공격력 +80%, 탄속 +50%, 쿨타임 -20%', mightBonus: 0.80, speedBonus: 0.50, cdrBonus: 0.20 },

    // [2] 갑옷 (Armor)
    armor_1: { id: 'armor_1', slot: 'armor', tier: 1, name: '견습 소환사 로브', icon: '🥋', color: '#94a3b8', desc: '최대 체력 +30, 이동속도 +10%', hpBonus: 30, moveBonus: 0.10 },
    armor_2: { id: 'armor_2', slot: 'armor', tier: 2, name: '대마도사의 망토', icon: '🥻', color: '#38bdf8', desc: '최대 체력 +70, 이속 +20%, 초당 체력 재생 +1', hpBonus: 70, moveBonus: 0.20, regenBonus: 1.0 },
    armor_3: { id: 'armor_3', slot: 'armor', tier: 3, name: '신성한 불사조의 성의', icon: '👑', color: '#facc15', desc: '최대 체력 +150, 이속 +30%, 초당 체력 재생 +3', hpBonus: 150, moveBonus: 0.30, regenBonus: 3.0 },

    // [3] 방패 (Shield)
    shield_1: { id: 'shield_1', slot: 'shield', tier: 1, name: '참나무 버클러', icon: '🪵', color: '#94a3b8', desc: '받는 피해 15% 감소', dmgRedBonus: 0.15 },
    shield_2: { id: 'shield_2', slot: 'shield', tier: 2, name: '미러 포스 방패', icon: '🛡️', color: '#38bdf8', desc: '받는 피해 30% 감소, 15초마다 1회 방어막 생성', dmgRedBonus: 0.30, shieldInterval: 15 },
    shield_3: { id: 'shield_3', slot: 'shield', tier: 3, name: '아이기스의 천상 결계', icon: '⚜️', color: '#facc15', desc: '받는 피해 45% 감소, 8초마다 2회 방어막 생성', dmgRedBonus: 0.45, shieldInterval: 8 }
  },

  // 7-1. ⏱️ 60분 일반 잡몹 지속 스폰 타임라인 (초 단위)
  waves: [
    { time: 0, interval: 1.2, type: 'slime', desc: '슬라임 무리 출현' },
    { time: 180, interval: 0.9, type: 'bat', desc: '박쥐 떼 습격' },
    { time: 480, interval: 0.8, type: 'skeleton', desc: '스켈레톤 보병대' },
    { time: 780, interval: 0.7, type: 'goblin_warrior', desc: '고블린 전사 군단' },
    { time: 1200, interval: 0.65, type: 'dark_orc', desc: '흑암 오크 돌격대' },
    { time: 1800, interval: 0.55, type: 'undead_knight', desc: '언데드 기사단 맹공' },
    { time: 2700, interval: 0.45, type: 'abyss_hound', desc: '심연의 하운드 떼거리' }
  ],

  // 7-2. ☠️ 보스 & 준보스 1회성 단일 출현 이벤트 (정해진 시간에 딱 1마리 소환)
  bossEvents: [
    { time: 540, type: 'elite_minotaur', name: '★ 9분 준보스: 미노타우로스' },
    { time: 1020, type: 'elite_skeleton_lord', name: '★ 17분 준보스: 해골 군주' },
    { time: 1200, type: 'golem_boss', name: '★ 20분 대형 보스: 고대 바위 골렘' },
    { time: 1680, type: 'elite_fire_golem', name: '★ 28분 준보스: 화염 골렘' },
    { time: 2100, type: 'lich_boss', name: '★ 35분 대형 보스: 심연의 리치' },
    { time: 2520, type: 'elite_shadow_reaper', name: '★ 42분 준보스: 그림자 사신' },
    { time: 3300, type: 'final_dragon_baal', name: '☠️ 55분 최종 레이드: 심연의 마룡 바알' }
  ],

  // 8. 몬스터 스탯 정의 (준보스 및 대형 보스 포함)
  monsters: {
    slime: { name: '초록 슬라임', hp: 16, speed: 2.0, radius: 10, damage: 6, exp: 1, color: '#4ade80' },
    bat: { name: '흡혈 박쥐', hp: 28, speed: 2.8, radius: 11, damage: 9, exp: 2, color: '#c084fc' },
    skeleton: { name: '해골 보병', hp: 60, speed: 1.8, radius: 14, damage: 14, exp: 4, color: '#e2e8f0' },
    elite_minotaur: { name: '미노타우로스 (준보스)', hp: 750, speed: 2.3, radius: 24, damage: 25, exp: 50, color: '#b45309', isElite: true },
    goblin_warrior: { name: '고블린 전사', hp: 120, speed: 2.2, radius: 16, damage: 18, exp: 6, color: '#16a34a' },
    elite_skeleton_lord: { name: '해골 군주 (준보스)', hp: 1900, speed: 2.0, radius: 26, damage: 32, exp: 90, color: '#94a3b8', isElite: true },
    golem_boss: { name: '고대 바위 골렘 (중간보스)', hp: 3200, speed: 1.1, radius: 36, damage: 36, exp: 160, color: '#d97706', isBoss: true },
    dark_orc: { name: '흑암 오크', hp: 260, speed: 1.7, radius: 18, damage: 24, exp: 12, color: '#334155' },
    elite_fire_golem: { name: '화염 골렘 (준보스)', hp: 4200, speed: 1.8, radius: 28, damage: 42, exp: 150, color: '#ef4444', isElite: true },
    lich_boss: { name: '심연의 리치 (중간보스)', hp: 7500, speed: 1.3, radius: 38, damage: 48, exp: 300, color: '#8b5cf6', isBoss: true },
    undead_knight: { name: '언데드 기사', hp: 480, speed: 2.0, radius: 20, damage: 30, exp: 18, color: '#64748b' },
    elite_shadow_reaper: { name: '그림자 사신 (준보스)', hp: 9000, speed: 2.5, radius: 30, damage: 52, exp: 260, color: '#1e1b4b', isElite: true },
    abyss_hound: { name: '심연의 하운드', hp: 700, speed: 2.9, radius: 16, damage: 38, exp: 25, color: '#dc2626' },
    final_dragon_baal: { name: '심연의 마룡 바알 (최종 보스)', hp: 25000, speed: 1.5, radius: 52, damage: 65, exp: 800, color: '#b91c1c', isBoss: true }
  }
};
