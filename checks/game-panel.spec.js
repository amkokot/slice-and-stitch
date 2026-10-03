import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fitRoomToPanel, gameDialogBounds } from '../game-panel.js'
import { SCENE_CHARACTER_LAYOUT, sceneCharacterPlane } from '../scene-character-layout.js'
import { PLAYER_STARTS } from '../hub-actors.js'

test('every room fits in the game panel without distorting or cropping its art', () => {
  for (const [sceneId, source] of Object.entries(SCENE_CHARACTER_LAYOUT)) {
    for (const [width, height] of [[1252,638], [1520,820], [374,780], [800,430]]) {
      const fitted = fitRoomToPanel(sceneId, width, height)
      assert.ok(fitted.width <= width + 1e-8)
      assert.ok(fitted.height <= height + 1e-8)
      assert.ok(Math.abs(fitted.width / fitted.height - source.width / source.height) < 1e-8)
      assert.ok(Math.abs(fitted.width - width) < 1e-8 || Math.abs(fitted.height - height) < 1e-8)
      const plane = sceneCharacterPlane(sceneId, fitted.width, fitted.height)
      assert.ok(Math.abs(plane.left) < 1e-8 && Math.abs(plane.top) < 1e-8)
      const player = PLAYER_STARTS[sceneId]
      assert.ok(player.x / 100 * plane.width < fitted.width)
      assert.ok(player.y / 100 * plane.height < fitted.height)
    }
  }
})

test('modal bounds are inset from the game frame, not from the browser page', () => {
  for (const frame of [{left:12,top:12,width:1256,height:696}, {left:6,top:6,width:378,height:832}, {left:220,top:90,width:900,height:600}]) {
    const bounds = gameDialogBounds(frame)
    assert.equal(bounds.centerX, frame.left + frame.width / 2)
    assert.equal(bounds.centerY, frame.top + frame.height / 2)
    assert.equal(bounds.width, frame.width - 24)
    assert.equal(bounds.height, frame.height - 24)
    assert.ok(bounds.centerX - bounds.width / 2 >= frame.left)
    assert.ok(bounds.centerY + bounds.height / 2 <= frame.top + frame.height)
  }
})

test('unknown rooms and transient zero-sized resize observations have safe geometry', () => {
  assert.deepEqual(fitRoomToPanel('unknown', 600, 600), fitRoomToPanel('street', 600, 600))
  const fitted = fitRoomToPanel('home', 0, 0)
  assert.ok(fitted.width > 0 && fitted.height > 0)
  assert.ok(gameDialogBounds({left:0,top:0,width:0,height:0}).width > 0)
})

test('all interactive game chrome is mounted inside the persistent game frame', () => {
  const frame = readFileSync(new URL('../game-panel.js', import.meta.url), 'utf8')
  const hub = readFileSync(new URL('../hub.js', import.meta.url), 'utf8')
  assert.match(frame, /panel\.append\(backdrop, hud, worldShell, appShell\)/)
  assert.match(frame, /for \(const dialog of document\.querySelectorAll\('body > dialog'\)\) panel\.append\(dialog\)/)
  assert.match(hub, /gameFrame\.hud\.prepend\(returnDock\)/)
  assert.match(hub, /gameFrame\.panel\.append\(drawer, toast\)/)
  assert.match(hub, /gameFrame\.panel\.addEventListener\('click'/)
  assert.doesNotMatch(hub, /document\.body\.append\(returnDock\)/)
})

test('reparenting preserves canvas and project handlers and native modal Escape wins over room navigation', () => {
  const frame = readFileSync(new URL('../game-panel.js', import.meta.url), 'utf8')
  const hub = readFileSync(new URL('../hub.js', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../game-panel.css', import.meta.url), 'utf8')
  assert.match(frame, /surface\.append\(card\.querySelector\('\.canvas-wrap'\)\)/)
  assert.match(frame, /patternDrawer\.append\(patternHandle, patternBoard\)/)
  assert.match(hub, /gameFrame\.panel\.querySelector\('dialog\[open\]'\)/)
  assert.match(css, /\.game-panel \.hub-return-dock \{ position: static/)
  assert.match(css, /width: min\(100cqw, 100cqh\)/)
  assert.match(css, /overscroll-behavior: contain/)
})
