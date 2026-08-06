import bcrypt from 'bcryptjs';
import readline from 'node:readline';

// Superadmin uchun SUPERADMIN_PASSWORD_HASH qiymatini olish uchun yordamchi skript.
// Ishga tushirish: npm run hash-password
// Parolni kiritgandan so'ng chiqqan hash'ni backend/.env fayliga
// SUPERADMIN_PASSWORD_HASH sifatida qo'ying (oddiy parolni hech qayerda saqlamang).

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Superadmin paroli: ', (password) => {
  rl.close();
  if (!password) {
    console.error('Parol bo\'sh bo\'lishi mumkin emas.');
    process.exit(1);
  }
  const hash = bcrypt.hashSync(password, 10);
  console.log('\nSUPERADMIN_PASSWORD_HASH quyidagini backend/.env fayliga qo\'ying:\n');
  console.log(`SUPERADMIN_PASSWORD_HASH=${hash}\n`);
});
