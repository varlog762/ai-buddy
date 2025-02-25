function User(name) {
  this.name = name;
  console.log(this);
}

const user = new User('John Doe');

console.log(user.name);
