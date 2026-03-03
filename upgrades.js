// Upgrade system for Butterfly Survivors

const UPGRADES = [
    {
        name: 'Attack Speed Up',
        description: 'Increase attack speed by 10% (stacks)',
        icon: '⚡',
        apply: (player) => {
            player.weapons.forEach(weapon => {
                weapon.attackSpeed *= 0.9;
            });
        }
    },
    {
        name: 'Damage Up',
        description: 'Increase all weapon damage by 5 (stacks)',
        icon: '💥',
        apply: (player) => {
            player.weapons.forEach(weapon => {
                weapon.damage += 5;
            });
        }
    },
    {
        name: 'Speed Up',
        description: 'Increase movement speed by 0.5 (stacks)',
        icon: '🏃',
        apply: (player) => {
            player.increaseSpeed(0.5);
        }
    },
    {
        name: 'Max HP Up',
        description: 'Increase max HP by 20 and heal (stacks)',
        icon: '❤️',
        apply: (player) => {
            player.increaseMaxHealth(20);
        }
    },
    {
        name: 'Heal',
        description: 'Restore to full health',
        icon: '💚',
        apply: (player) => {
            player.heal(999);
        }
    },
    {
        name: 'Multi-Shot',
        description: 'Fire +1 projectile (stacks, affects Pollen & Sparkle)',
        icon: '🎯',
        apply: (player) => {
            player.weapons.forEach(weapon => {
                if (weapon instanceof PollenShot || weapon instanceof SparkleBurst) {
                    weapon.projectileCount += 1;
                }
            });
        }
    },
    {
        name: 'Sparkle Burst',
        description: 'New weapon / +1 projectile +3 damage',
        icon: '✨',
        apply: (player) => {
            // Check if player already has this weapon
            const sparkleBurst = player.weapons.find(w => w instanceof SparkleBurst);
            if (!sparkleBurst) {
                player.addWeapon(new SparkleBurst());
            } else {
                // If already has it, increase projectile count and damage
                sparkleBurst.projectileCount += 1;
                sparkleBurst.damage += 3;
            }
        }
    },
    {
        name: 'Wing Blade',
        description: 'New weapon / +1 blade +2 damage',
        icon: '🗡️',
        apply: (player) => {
            // Check if player already has this weapon
            const wingBlade = player.weapons.find(w => w instanceof WingBlade);
            if (!wingBlade) {
                player.addWeapon(new WingBlade());
            } else {
                // If already has it, add another blade and increase damage
                wingBlade.addBlade();
                wingBlade.damage += 2;
            }
        }
    },
    {
        name: 'Pickup Range Up',
        description: 'Increase XP pickup range by 30 (stacks)',
        icon: '🧲',
        apply: (player) => {
            player.increasePickupRange(30);
        }
    }
];

function getRandomUpgrades(count = 3) {
    // Shuffle and return random upgrades
    const shuffled = UPGRADES.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
