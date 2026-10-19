-- Permite que el servidor elimine partidas en vivo guardadas. La API solo deja borrar a quien guardó la partida.
begin;
grant delete on public.sc_web_live_results to service_role;
commit;
