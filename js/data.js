/* ==========================================================================
   js/data.js - 60-Minute Tamer Survivors Data Architecture
   - 3-Tier Pet Evolution (1차 -> 2차 -> 3차 최종 각성)
   - Skill Combination & Evolution Table (합성 진화)
   - 60-Minute Monster Wave Timeline
   ========================================================================== */

const GAME_DATA = {
  // 0. 👑 3대 직업군 (소환사 / 검사 / 궁수) 및 9대 세부 특화 시스템
  classes: {
    summoner: {
      id: 'summoner',
      name: '소환사 (Summoner)',
      icon: '🧙',
      color: '#818cf8',
      desc: '신비로운 3대 고대 신수를 소환하여 전장을 지휘하는 원소 마도사.',
      subclasses: {
        ignis: {
          id: 'ignis',
          classId: 'summoner',
          name: '🔥 화염 신수: 이그니스',
          title: '화염 폭발형 (이그니스)',
          icon: '🔥',
          color: '#f97316',
          desc: '고열의 화염구와 브레스로 적들을 불태우는 공격 특화 신수.',
          startingSkill: 'fireball',
          ultimate: {
            id: 'hellfire_burst',
            name: '지옥불 대폭발',
            icon: '💥',
            cooldown: 12,
            damage: 150,
            desc: '화면 전체의 모든 적에게 화염 충격파 폭발을 가합니다.'
          },
          evolution2: { reqLevel: 15, id: 'bahamut', tier: 2, name: '용왕 바하무트 (2차 전직)', icon: '🐲', color: '#dc2626', desc: '고대 화염의 용으로 진화했습니다. 전방위 브레스와 폭발력이 대폭 증가합니다.', unlockSkill: 'dragon_breath' },
          evolution3: { reqLevel: 35, id: 'agni_dragon', tier: 3, name: '태양신 아그니 드래곤 (3차 최종)', icon: '👑', color: '#fbbf24', desc: '태양의 화신으로 최종 각성했습니다. 영구 불꽃 아우라와 항성 폭발을 일으킵니다.', unlockSkill: 'solar_flare' }
        },
        bolt: {
          id: 'bolt',
          classId: 'summoner',
          name: '⚡ 뇌전 신수: 볼트',
          title: '초고속 연쇄형 (볼트)',
          icon: '⚡',
          color: '#38bdf8',
          desc: '눈에 보이지 않는 속도로 연쇄 번개와 벼락을 내리꽂는 기동 특화 신수.',
          startingSkill: 'chain_lightning',
          ultimate: {
            id: 'thunder_dash',
            name: '전광석화 돌격',
            icon: '⚡',
            cooldown: 10,
            duration: 2.5,
            speedMul: 2.2,
            damage: 60,
            desc: '2.5초간 무적 상태로 초고속 질주하며 부딪히는 적을 감전시킵니다.'
          },
          evolution2: { reqLevel: 15, id: 'fenrir', tier: 2, name: '뇌신 펜리르 (2차 전직)', icon: '🐺', color: '#818cf8', desc: '신화의 뇌수로 각성했습니다. 무작위 벼락 폭풍을 해금합니다.', unlockSkill: 'thunderstorm' },
          evolution3: { reqLevel: 35, id: 'zeus_hound', tier: 3, name: '창공의 뇌제 제우스 (3차 최종)', icon: '👑', color: '#e0e7ff', desc: '천상의 벼락을 다스리는 신수로 최종 각성했습니다.', unlockSkill: 'judgment_ray' }
        },
        sylph: {
          id: 'sylph',
          classId: 'summoner',
          name: '🍃 대지 신수: 실피드',
          title: '방어 회복형 (실피드)',
          icon: '🍃',
          color: '#4ade80',
          desc: '성스러운 가시 덩굴과 생명의 숲으로 아군을 보호하고 치유하는 신수.',
          startingSkill: 'thorn_aura',
          ultimate: {
            id: 'divine_bloom',
            name: '세계수의 만개',
            icon: '🌸',
            cooldown: 14,
            heal: 45,
            damage: 80,
            desc: '화면 전체 적을 넉백시키고 아군 전체 HP를 45 회복합니다.'
          },
          evolution2: { reqLevel: 15, id: 'dryad_queen', tier: 2, name: '숲의 성수 그리폰 (2차 전직)', icon: '🦌', color: '#16a34a', desc: '숲의 수호 성수로 진화했습니다. 성역 치유 장판을 해금합니다.', unlockSkill: 'sanctuary' },
          evolution3: { reqLevel: 35, id: 'yggdrasil_seraph', tier: 3, name: '세계수의 세라프 (3차 최종)', icon: '👑', color: '#86efac', desc: '태초의 생명수로 최종 각성했습니다. 영구 HP 재생 오라를 부여합니다.', unlockSkill: 'life_rebirth' }
        }
      }
    },
    warrior: {
      id: 'warrior',
      name: '검사 (Swordsman)',
      icon: '⚔️',
      color: '#ef4444',
      desc: '묵직한 대검과 방패로 최전선에서 적들을 베어넘기는 호쾌한 근접 전사.',
      subclasses: {
        berserker: {
          id: 'berserker',
          classId: 'warrior',
          name: '⚔️ 광전사 (버서커)',
          title: '공격형 (광전사)',
          icon: '⚔️',
          color: '#ef4444',
          desc: '양손 대검으로 전방 180도를 베어가르는 근접 파괴자. 체력이 낮을수록 공속 폭증!',
          startingSkill: 'frenzy_slash',
          ultimate: {
            id: 'bloodlust',
            name: '피의 폭주 (Bloodlust)',
            icon: '🩸',
            cooldown: 12,
            duration: 5.0,
            speedMul: 1.5,
            damage: 180,
            desc: '5초간 공속 200% 증가 및 베기마다 거대한 핏빛 검기 폭풍을 방출합니다!'
          },
          evolution2: { reqLevel: 15, id: 'blood_slayer', tier: 2, name: '학살자 블러드 슬레이어 (2차 전직)', icon: '🪓', color: '#b91c1c', desc: '피의 군주로 각성했습니다. X자 교차 참격을 해금합니다.', unlockSkill: 'blood_cross' },
          evolution3: { reqLevel: 35, id: 'sword_emperor', tier: 3, name: '진 무신 (Sword Emperor - 3차 최종)', icon: '👑', color: '#f87171', desc: '검의 극의에 도달한 무신입니다. 화면을 일도양단하는 천지개벽 참격을 방출합니다.', unlockSkill: 'omnislash' }
        },
        paladin: {
          id: 'paladin',
          classId: 'warrior',
          name: '🛡️ 성기사 (가디언)',
          title: '방어형 (성기사)',
          icon: '🛡️',
          color: '#f59e0b',
          desc: '거대한 타워 실드로 적을 넉백시키고 기절시키는 불굴의 방어 전사.',
          startingSkill: 'shield_bash',
          ultimate: {
            id: 'aegis_fortress',
            name: '아이기스의 성역',
            icon: '⚜️',
            cooldown: 15,
            duration: 3.5,
            damage: 120,
            desc: '3.5초간 완전 무적 상태가 되며, 주변 360도로 거대한 성스러운 충격파를 방출합니다!'
          },
          evolution2: { reqLevel: 15, id: 'crusader', tier: 2, name: '신성 크루세이더 (2차 전직)', icon: '✝️', color: '#facc15', desc: '성전 기사로 각성했습니다. 성스러운 방패 회전벽을 해금합니다.', unlockSkill: 'shield_spin' },
          evolution3: { reqLevel: 35, id: 'grand_crusader', tier: 3, name: '천상 기사단장 (Grand Crusader - 3차 최종)', icon: '👑', color: '#fef08a', desc: '빛의 기사단장으로 최종 각성했습니다. 상시 무적 방어막과 신성 참격을 해금합니다.', unlockSkill: 'holy_wrath' }
        },
        runeblade: {
          id: 'runeblade',
          classId: 'warrior',
          name: '⚖️ 마검사 (룬 블레이더)',
          title: '하이브리드 (마검사)',
          icon: '🔮',
          color: '#a855f7',
          desc: '검에 3원소 마법 룬을 인챈트하여 검기와 원소 탄환을 동시 방출하는 마검사.',
          startingSkill: 'rune_wave',
          ultimate: {
            id: 'elemental_storm',
            name: '마검 폭풍 (Elemental Storm)',
            icon: '🌀',
            cooldown: 14,
            damage: 160,
            desc: '화면 360도로 16개의 삼원소 마법 검기가 폭풍처럼 회전하며 광역 난무를 펼칩니다!'
          },
          evolution2: { reqLevel: 15, id: 'spellsword', tier: 2, name: '원소 마도검성 (2차 전직)', icon: '🗡️', color: '#8b5cf6', desc: '마도검사로 각성했습니다. 화염/얼음 검기를 연속 교차 방출합니다.', unlockSkill: 'dual_element_slash' },
          evolution3: { reqLevel: 35, id: 'rune_master', tier: 3, name: '시공의 마검신 (Rune Master - 3차 최종)', icon: '👑', color: '#c084fc', desc: '원소의 진리에 도달한 마검신입니다. 시공간을 가르는 차원 참격을 해금합니다.', unlockSkill: 'dimension_slash' }
        }
      }
    },
    archer: {
      id: 'archer',
      name: '궁수 (Archer)',
      icon: '🏹',
      color: '#10b981',
      desc: '초장거리 저격과 화살 난사로 적들이 다가오기 전에 섬멸하는 사수.',
      subclasses: {
        sniper: {
          id: 'sniper',
          classId: 'archer',
          name: '🎯 스나이퍼 (저격수)',
          title: '저격형 (스나이퍼)',
          icon: '🎯',
          color: '#06b6d4',
          desc: '화면 끝까지 적을 100% 관통하며 날아가는 초고속 에너지 저격 화살!',
          startingSkill: 'pierce_snipe',
          ultimate: {
            id: 'orbital_snipe',
            name: '궤도 포격 저격 (Orbital Snipe)',
            icon: '⚡',
            cooldown: 12,
            damage: 220,
            desc: '하늘에서 거대한 궤도 광선 레이저가 내리꽂히며 전장 일직선의 적을 소멸시킵니다!'
          },
          evolution2: { reqLevel: 15, id: 'headhunter', tier: 2, name: '헤드헌터 스나이퍼 (2차 전직)', icon: '🔭', color: '#0891b2', desc: '전설의 암살 궁수로 각성했습니다. 3줄기 관통 레이저 저격을 해금합니다.', unlockSkill: 'triple_snipe' },
          evolution3: { reqLevel: 35, id: 'divine_artemis', tier: 3, name: '신궁 아르테미스 (Artemis - 3차 최종)', icon: '👑', color: '#67e8f9', desc: '달빛의 여신으로 최종 각성했습니다. 시공간을 꿰뚫는 즉사급 유도 관통 광선을 해금합니다.', unlockSkill: 'artemis_ray' }
        },
        windrunner: {
          id: 'windrunner',
          classId: 'archer',
          name: '🌪️ 윈드러너 (속사궁수)',
          title: '난사형 (윈드러너)',
          icon: '🌪️',
          color: '#10b981',
          desc: '0.3초마다 3연장 화살을 기관총처럼 퍼붓는 초고속 난사형 궁수.',
          startingSkill: 'rapid_gale',
          ultimate: {
            id: 'arrow_rain_nova',
            name: '천공의 화살비 (Arrow Rain)',
            icon: '🌧️',
            cooldown: 13,
            damage: 150,
            desc: '하늘에서 수백 발의 황금 화살비가 전장에 쏟아져 내리며 연속 폭발 충격파를 일으킵니다!'
          },
          evolution2: { reqLevel: 15, id: 'tempest_ranger', tier: 2, name: '템페스트 레인저 (2차 전직)', icon: '🏹', color: '#059669', desc: '질풍의 사수로 각성했습니다. 8방향 부채꼴 멀티샷을 해금합니다.', unlockSkill: 'multi_wind_shot' },
          evolution3: { reqLevel: 35, id: 'tempest_bowmaster', tier: 3, name: '폭풍의 신궁 (Tempest - 3차 최종)', icon: '👑', color: '#34d399', desc: '바람을 지배하는 신궁입니다. 화면 전체를 뒤덮는 유도 바람 폭풍을 해금합니다.', unlockSkill: 'wind_storm_nova' }
        },
        trapper: {
          id: 'trapper',
          classId: 'archer',
          name: '🐾 비스트 트래퍼 (함정/야수)',
          title: '하이브리드 (트래퍼)',
          icon: '🐾',
          color: '#d97706',
          desc: '지면에 폭발 덫을 매설하고, 영체 늑대와 매를 소환해 함께 싸우는 사냥꾼.',
          startingSkill: 'explosive_trap',
          ultimate: {
            id: 'beast_stampede',
            name: '야수 대군단 쇄도',
            icon: '🐺',
            cooldown: 14,
            damage: 170,
            desc: '영체 늑대 떼와 맹금 군단이 전장을 돌진하며 적 진형을 초토화시킵니다!'
          },
          evolution2: { reqLevel: 15, id: 'hunter_lord', tier: 2, name: '사냥의 대가 헌터로드 (2차 전직)', icon: '🦅', color: '#b45309', desc: '야수 지휘관으로 각성했습니다. 빙결 폭발 덫과 맹금 급강하를 해금합니다.', unlockSkill: 'frost_trap_hawk' },
          evolution3: { reqLevel: 35, id: 'forest_overlord', tier: 3, name: '대자연의 군주 (Overlord - 3차 최종)', icon: '👑', color: '#f59e0b', desc: '태초의 대자연 지배자입니다. 거대 고대 베히모스 영체를 소환합니다.', unlockSkill: 'behemoth_call' }
        }
      }
    }
  },

  // 1. 펫 3종 (소환사 전용 및 호환): 1차 -> 2차 -> 3차 전직 트리
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
    },

    // --- [5] ⚔️ 검사 & 🏹 궁수 신규 특화 스킬군 ---
    frenzy_slash: {
      id: 'frenzy_slash',
      name: '대검 쾌참 (Frenzy Slash)',
      element: 'physical',
      type: 'melee_slash_arc',
      icon: '⚔️',
      desc: '[검사: 광전사] 전방 160도 초근접 대검을 호쾌하게 베어넘겨 묵직한 피해와 넉백을 가합니다. (근접 고위력)',
      maxLevel: 8,
      baseCooldown: 0.55,
      baseDamage: 58,
      range: 85
    },
    shield_bash: {
      id: 'shield_bash',
      name: '방패 강타 (Shield Bash)',
      element: 'holy',
      type: 'shield_bash_melee',
      icon: '🛡️',
      desc: '[검사: 성기사] 전방 초근접 적들을 타워실드로 강하게 내려찍어 멀리 튕겨내고 기절시킵니다.',
      maxLevel: 8,
      baseCooldown: 0.75,
      baseDamage: 52,
      range: 75
    },
    rune_wave: {
      id: 'rune_wave',
      name: '마검 회전참 (Rune Spin Slash)',
      element: 'arcane',
      type: 'rune_spin_slash',
      icon: '🔮',
      desc: '[검사: 마검사] 제자리에서 360도 마검을 회전하여 주변 초근접 적들을 룬 칼날 폭풍으로 베어냅니다.',
      maxLevel: 8,
      baseCooldown: 0.65,
      baseDamage: 50,
      range: 85
    },
    pierce_snipe: {
      id: 'pierce_snipe',
      name: '관통 저격 (Pierce Snipe)',
      element: 'lightning',
      type: 'sniper_beam',
      icon: '🎯',
      desc: '[궁수: 스나이퍼] 화면 끝까지 적을 일렬로 관통하는 초고속 레이저 화살을 발사합니다.',
      maxLevel: 8,
      baseCooldown: 1.1,
      baseDamage: 50,
      speed: 20
    },
    rapid_gale: {
      id: 'rapid_gale',
      name: '질풍 연사 (Rapid Gale)',
      element: 'wind',
      type: 'rapid_arrow',
      icon: '🌪️',
      desc: '[궁수: 윈드러너] 0.35초마다 바람의 유도 화살 3발을 기관총처럼 고속 연사합니다.',
      maxLevel: 8,
      baseCooldown: 0.35,
      baseDamage: 15,
      speed: 12,
      count: 3
    },
    explosive_trap: {
      id: 'explosive_trap',
      name: '마법 폭발 덫 (Explosive Trap)',
      element: 'fire',
      type: 'trap',
      icon: '💣',
      desc: '[궁수: 트래퍼] 지면에 마법 지뢰 덫을 설치하여 적이 밟으면 연쇄 대폭발을 일으킵니다.',
      maxLevel: 8,
      baseCooldown: 1.4,
      baseDamage: 60,
      radius: 95
    },

    // --- [6] 🔥 검사/궁수 합성 진화 스킬 (Evolved Skills) ---
    blood_carnage: {
      id: 'blood_carnage',
      name: '🩸 피의 대참격 (Blood Carnage)',
      isEvolved: true,
      element: 'dark',
      type: 'melee_arc_mega',
      icon: '🩸',
      desc: '[합성 진화: 쾌검참격+송곳니] 대검으로 전방 근접 적들을 맹렬하게 난도질하여 초토화하고 적을 크게 밀쳐냅니다. (근접 극딜)',
      maxLevel: 1,
      baseCooldown: 0.45,
      baseDamage: 110,
      range: 105
    },
    divine_bulwark: {
      id: 'divine_bulwark',
      name: '🛡️ 천상의 성채방패 (Divine Bulwark)',
      isEvolved: true,
      element: 'holy',
      type: 'shield_barrier_wave',
      icon: '⚜️',
      desc: '[합성 진화: 방패강타+인력수정] 몸 주변 360도로 거대한 신성 방패벽을 후려쳐 근접 적들을 완전히 날려버립니다.',
      maxLevel: 1,
      baseCooldown: 0.65,
      baseDamage: 85,
      radius: 95
    },
    infinite_runes: {
      id: 'infinite_runes',
      name: '🔮 무한 원소마검 (Infinite Runes)',
      isEvolved: true,
      element: 'arcane',
      type: 'rune_storm',
      icon: '🌌',
      desc: '[합성 진화: 룬파동+유대방울] 몸 주변에 3원소 마검 칼날 궤적이 맹렬히 회전하여 근접하는 모든 적을 믹서기처럼 분쇄합니다.',
      maxLevel: 1,
      baseCooldown: 0.45,
      baseDamage: 75,
      range: 95
    },
    god_pierce_snipe: {
      id: 'god_pierce_snipe',
      name: '🎯 신살의 관통포 (God Slayer)',
      isEvolved: true,
      element: 'holy',
      type: 'sniper_cannon',
      icon: '⚡',
      desc: '[합성 진화: 관통저격+네잎클로버] 화면을 가르는 초거대 황금 레일건 빔이 100% 치명타로 대폭발합니다.',
      maxLevel: 1,
      baseCooldown: 0.9,
      baseDamage: 130
    },
    tempest_gale_bow: {
      id: 'tempest_gale_bow',
      name: '🌪️ 폭풍의 질풍궁 (Tempest Bow)',
      isEvolved: true,
      element: 'wind',
      type: 'rapid_gatling',
      icon: '🌪️',
      desc: '[합성 진화: 질풍연사+바람호각] 초당 12발의 유도 바람 화살이 기관총처럼 쏟아져 나와 전장을 초토화합니다.',
      maxLevel: 1,
      baseCooldown: 0.15,
      baseDamage: 32
    },
    armageddon_traps: {
      id: 'armageddon_traps',
      name: '💣 아마겟돈 지뢰진 (Armageddon)',
      isEvolved: true,
      element: 'fire',
      type: 'trap_cluster',
      icon: '💥',
      desc: '[합성 진화: 폭발덫+현자고서] 전장에 상시 5개의 집속 폭탄 지뢰가 매설되어 연쇄 핵폭발을 일으킵니다.',
      maxLevel: 1,
      baseCooldown: 1.0,
      baseDamage: 110,
      count: 5,
      radius: 120
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

  // 4. 🧬 합성 진화 조합 공식표 (총 17대 합성 진화!)
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
    { baseSkill: 'dark_minion', reqPassive: 'beast_fang', result: 'abyss_necromancer' },
    // ⚔️ 검사 전용 합성 진화
    { baseSkill: 'frenzy_slash', reqPassive: 'beast_fang', result: 'blood_carnage' },
    { baseSkill: 'shield_bash', reqPassive: 'magnet_gem', result: 'divine_bulwark' },
    { baseSkill: 'rune_wave', reqPassive: 'friendship_bell', result: 'infinite_runes' },
    // 🏹 궁수 전용 합성 진화
    { baseSkill: 'pierce_snipe', reqPassive: 'four_leaf_clover', result: 'god_pierce_snipe' },
    { baseSkill: 'rapid_gale', reqPassive: 'speed_whistle', result: 'tempest_gale_bow' },
    { baseSkill: 'explosive_trap', reqPassive: 'sage_tome', result: 'armageddon_traps' }
  ],

  // 5. 🗺️ 드래곤퀘스트 32비트 초대형 월드 맵 (16000 x 16000)
  world: {
    width: 16000,
    height: 16000,
    landmarks: [
      { id: 'castle', spriteKey: 'landmark_castle', name: '🏰 라다톰 왕성 (중앙 수도)', x: 8000, y: 8000, radius: 280, color: '#38bdf8' },
      { id: 'crypt', spriteKey: 'landmark_crypt', name: '💀 암흑 묘지 (북서쪽 독늪)', x: 3500, y: 3500, radius: 240, color: '#a855f7' },
      { id: 'shrine', spriteKey: 'landmark_shrine', name: '⚡ 고대 번개 신전 (북동쪽 설산)', x: 12500, y: 3500, radius: 240, color: '#facc15' },
      { id: 'tree', spriteKey: 'landmark_tree', name: '🌳 신성 세계수 이그드라실 (남서쪽 대수림)', x: 3500, y: 12500, radius: 240, color: '#22c55e' },
      { id: 'volcano', spriteKey: 'landmark_volcano', name: '🌋 용왕의 화산 제단 (남동쪽)', x: 12500, y: 12500, radius: 240, color: '#ef4444' }
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

  // 7-1. ⏱️ 60분 일반 잡몹 지속 스폰 타임라인 (초 단위 - 드래곤퀘스트 테마)
  waves: [
    { time: 0, interval: 1.2, type: 'slime', desc: '💧 물방울 슬라임 무리 출현!' },
    { time: 180, interval: 0.9, type: 'bat', desc: '🦇 드라키 박쥐 떼 습격!' },
    { time: 480, interval: 0.8, type: 'skeleton', desc: '💀 해골 검사 보병대 진군!' },
    { time: 780, interval: 0.7, type: 'goblin_warrior', desc: '🦎 리자드맨 도마뱀 전사 군단!' },
    { time: 1200, interval: 0.65, type: 'dark_orc', desc: '🐗 오크 헌터 삼지창 돌격대!' },
    { time: 1800, interval: 0.55, type: 'undead_knight', desc: '⚔️ 지옥의 움직이는 갑옷 기사단!' },
    { time: 2700, interval: 0.45, type: 'abyss_hound', desc: '🔥 마견 켈베로스 무리 맹공!' }
  ],

  // 7-2. ☠️ 보스 & 준보스 1회성 단일 출현 이벤트 (정해진 시간에 딱 1마리 소환)
  bossEvents: [
    { time: 540, type: 'elite_minotaur', name: '★ 9분 준보스: 외눈거인 기간테스 (Gigantes)' },
    { time: 1020, type: 'elite_skeleton_lord', name: '★ 17분 준보스: 해골 군주 (Skull Knight)' },
    { time: 1200, type: 'golem_boss', name: '★ 20분 대형 보스: 스톤 골렘 (Stone Golem)' },
    { time: 1680, type: 'elite_fire_golem', name: '★ 28분 준보스: 마그마 골렘 (Lava Golem)' },
    { time: 2100, type: 'lich_boss', name: '★ 35분 대형 보스: 대마도사 하곤 (Archmage)' },
    { time: 2520, type: 'elite_shadow_reaper', name: '★ 42분 준보스: 섀도우 나이트 (Shadow Knight)' },
    { time: 3300, type: 'final_dragon_baal', name: '☠️ 55분 최종 레이드: 그레이트 드래곤 (Great Dragon)' }
  ],

  // 8. 몬스터 스탯 정의 (드래곤퀘스트 콘셉트)
  monsters: {
    slime: { name: '물방울 슬라임 (Slime)', hp: 16, speed: 2.0, radius: 12, damage: 6, exp: 1, color: '#38bdf8' },
    bat: { name: '드라키 박쥐 (Dracky)', hp: 28, speed: 2.8, radius: 12, damage: 9, exp: 2, color: '#a855f7' },
    skeleton: { name: '해골 검사 (Skeleton)', hp: 60, speed: 1.8, radius: 14, damage: 14, exp: 4, color: '#e2e8f0' },
    goblin_warrior: { name: '리자드맨 (Lizardman)', hp: 120, speed: 2.2, radius: 16, damage: 18, exp: 6, color: '#16a34a' },
    dark_orc: { name: '오크 헌터 (Orc)', hp: 260, speed: 1.7, radius: 18, damage: 24, exp: 12, color: '#15803d' },
    undead_knight: { name: '움직이는 갑옷 (Lethal Armor)', hp: 480, speed: 2.0, radius: 20, damage: 30, exp: 18, color: '#3b82f6' },
    abyss_hound: { name: '마견 켈베로스 (Hellhound)', hp: 700, speed: 2.9, radius: 16, damage: 38, exp: 25, color: '#dc2626' },
    elite_minotaur: { name: '기간테스 (Gigantes)', hp: 750, speed: 2.3, radius: 25, damage: 25, exp: 50, color: '#0284c7', isElite: true },
    elite_skeleton_lord: { name: '해골 군주 (Skull Knight)', hp: 1900, speed: 2.0, radius: 26, damage: 32, exp: 90, color: '#94a3b8', isElite: true },
    golem_boss: { name: '스톤 골렘 (Stone Golem)', hp: 3200, speed: 1.1, radius: 36, damage: 36, exp: 160, color: '#d97706', isBoss: true },
    elite_fire_golem: { name: '마그마 골렘 (Lava Golem)', hp: 4200, speed: 1.8, radius: 28, damage: 42, exp: 150, color: '#ef4444', isElite: true },
    lich_boss: { name: '대마도사 하곤 (Archmage)', hp: 7500, speed: 1.3, radius: 38, damage: 48, exp: 300, color: '#8b5cf6', isBoss: true },
    elite_shadow_reaper: { name: '섀도우 나이트 (Shadow Knight)', hp: 9000, speed: 2.5, radius: 30, damage: 52, exp: 260, color: '#1e1b4b', isElite: true },
    final_dragon_baal: { name: '그레이트 드래곤 (Great Dragon)', hp: 25000, speed: 1.5, radius: 52, damage: 65, exp: 800, color: '#15803d', isBoss: true }
  }
};
