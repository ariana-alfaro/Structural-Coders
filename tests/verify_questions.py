"""Execute only our fixed demonstration snippets, never student input."""
assert 'Structural Coders'[::-1] == 'sredoC larutcurtS'
assert 17 // 5 == 3
assert f'{2**10 = }' == '2**10 = 1024'
altura = 12
altura = 'doce'
assert isinstance(altura, str)
assert 8 * 5 == 40
assert bool([]) is False
assert {'material': 'acero', 'pisos': 4}['material'] == 'acero'
assert {1, 2, 3} & {2, 3, 4} == {2, 3}
niveles = [1, 2]
niveles.append(3)
assert niveles == [1, 2, 3]
assert f'{12.5:.2f}' == '12.50'
print('10/10 respuestas Python verificadas')
